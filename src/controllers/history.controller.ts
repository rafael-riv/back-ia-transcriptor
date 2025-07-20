import Transcript from "../models/Transcript";
import { Request, Response } from "express";

interface QueryParams {
  page?: string;
  limit?: string;
  search?: string;
  type?: 'all' | 'recent' | 'old';
  sortBy?: 'newest' | 'oldest' | 'longest' | 'shortest';
  startDate?: string;
  endDate?: string;
}

export const listHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Parámetros de consulta con valores por defecto
    const {
      page = '1',
      limit = '10',
      search = '',
      type = 'all',
      sortBy = 'newest',
      startDate,
      endDate
    }: QueryParams = req.query;

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit))); // Máximo 100 por página
    const skip = (pageNumber - 1) * limitNumber;

    // Construir filtro base
    let filter: any = { owner: userId };

    // Filtro de búsqueda de texto
    if (search && search.trim()) {
      filter.$or = [
        { text: { $regex: search.trim(), $options: 'i' } },
        { filename: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Filtro por rango de fechas
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // Incluir todo el día
        filter.createdAt.$lte = endDateTime;
      }
    }

    // Filtro por tipo de fecha
    if (type === 'recent') {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      filter.createdAt = { ...filter.createdAt, $gte: last7Days };
    } else if (type === 'old') {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      filter.createdAt = { ...filter.createdAt, $lt: last30Days };
    }

    // Configurar ordenamiento
    let sort: any = {};
    switch (sortBy) {
      case 'oldest':
        sort.createdAt = 1;
        break;
      case 'longest':
        sort.textLength = -1; // Necesitamos agregar este campo virtual o calcularlo
        break;
      case 'shortest':
        sort.textLength = 1;
        break;
      case 'newest':
      default:
        sort.createdAt = -1;
        break;
    }

    // Ejecutar consultas en paralelo para mejor rendimiento
    const [documents, totalCount] = await Promise.all([
      Transcript.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .lean(), // .lean() para mejor rendimiento
      Transcript.countDocuments(filter)
    ]);

    // Si ordenamos por longitud de texto, necesitamos hacerlo en memoria
    // porque MongoDB no tiene un campo de longitud de texto indexado
    if (sortBy === 'longest' || sortBy === 'shortest') {
      const docsWithLength = documents.map(doc => ({
        ...doc,
        textLength: doc.text ? doc.text.length : 0
      })) as any[];
      
      docsWithLength.sort((a, b) => {
        return sortBy === 'longest' 
          ? b.textLength - a.textLength 
          : a.textLength - b.textLength;
      });
      
      // Remover el campo temporal y retornar los documentos limpios
      const sortedDocuments = docsWithLength.map(({ textLength, ...doc }) => doc);
      // Reemplazar el array original con los documentos ordenados
      documents.splice(0, documents.length, ...sortedDocuments);
    }

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(totalCount / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    // Calcular estadísticas adicionales
    const stats = await calculateStatistics(userId, filter);

    // Respuesta con metadatos completos
    const response = {
      data: documents,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        limit: limitNumber,
        hasNextPage,
        hasPrevPage,
        startIndex: skip + 1,
        endIndex: Math.min(skip + limitNumber, totalCount)
      },
      filters: {
        search: search || null,
        type,
        sortBy,
        startDate: startDate || null,
        endDate: endDate || null
      },
      statistics: stats
    };

    res.json(response);

  } catch (error) {
    console.error('Error in listHistory:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      msg: 'No se pudieron cargar las transcripciones'
    });
  }
};

// Función auxiliar para calcular estadísticas
async function calculateStatistics(userId: string, baseFilter: any) {
  try {
    // Usar agregación para estadísticas eficientes
    const pipeline = [
      { $match: { ...baseFilter, owner: userId } },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          totalWords: {
            $sum: {
              $size: {
                $split: [
                  { $trim: { input: "$text" } },
                  " "
                ]
              }
            }
          },
          totalCharacters: {
            $sum: { $strLenCP: "$text" }
          },
          avgWordsPerDoc: {
            $avg: {
              $size: {
                $split: [
                  { $trim: { input: "$text" } },
                  " "
                ]
              }
            }
          },
          avgCharactersPerDoc: {
            $avg: { $strLenCP: "$text" }
          },
          longestText: { $max: { $strLenCP: "$text" } },
          shortestText: { $min: { $strLenCP: "$text" } }
        }
      }
    ];

    const [stats] = await Transcript.aggregate(pipeline);

    if (!stats) {
      return {
        totalDocuments: 0,
        totalWords: 0,
        totalCharacters: 0,
        avgWordsPerDoc: 0,
        avgCharactersPerDoc: 0,
        longestText: 0,
        shortestText: 0
      };
    }

    return {
      totalDocuments: stats.totalDocuments || 0,
      totalWords: stats.totalWords || 0,
      totalCharacters: stats.totalCharacters || 0,
      avgWordsPerDoc: Math.round(stats.avgWordsPerDoc || 0),
      avgCharactersPerDoc: Math.round(stats.avgCharactersPerDoc || 0),
      longestText: stats.longestText || 0,
      shortestText: stats.shortestText || 0
    };
  } catch (error) {
    console.error('Error calculating statistics:', error);
    return {
      totalDocuments: 0,
      totalWords: 0,
      totalCharacters: 0,
      avgWordsPerDoc: 0,
      avgCharactersPerDoc: 0,
      longestText: 0,
      shortestText: 0
    };
  }
}

// Endpoint adicional para obtener solo estadísticas
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const stats = await calculateStatistics(userId, { owner: userId });
    res.json(stats);
  } catch (error) {
    console.error('Error in getStatistics:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      msg: 'No se pudieron cargar las estadísticas'
    });
  }
};

// Endpoint para eliminar una transcripción
export const deleteTranscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const transcriptionId = req.params.id;

    const transcription = await Transcript.findOne({
      _id: transcriptionId,
      owner: userId
    });

    if (!transcription) {
      return res.status(404).json({
        msg: 'Transcripción no encontrada'
      });
    }

    await Transcript.findByIdAndDelete(transcriptionId);

    res.json({
      msg: 'Transcripción eliminada exitosamente',
      deletedId: transcriptionId
    });

  } catch (error) {
    console.error('Error in deleteTranscription:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      msg: 'No se pudo eliminar la transcripción'
    });
  }
};

// Endpoint para obtener una transcripción específica
export const getTranscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const transcriptionId = req.params.id;

    const transcription = await Transcript.findOne({
      _id: transcriptionId,
      owner: userId
    });

    if (!transcription) {
      return res.status(404).json({
        msg: 'Transcripción no encontrada'
      });
    }

    res.json(transcription);

  } catch (error) {
    console.error('Error in getTranscription:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      msg: 'No se pudo cargar la transcripción'
    });
  }
};
