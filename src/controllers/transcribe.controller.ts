import Transcript from "../models/Transcript";
import { Request, Response } from "express";
import { BatchClient } from '@speechmatics/batch-client';
import { openAsBlob } from 'node:fs';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.API_KEY_SPEECHMATICS;
if (!apiKey) {
  console.warn('Warning: API_KEY_SPEECHMATICS not found in environment variables');
}

export const createTranscript = async (req: Request, res: Response) => {
  try {
    const fileReceived = (req as any).file;
    const user = (req as any).user;
    
    if (!fileReceived || !user) {
      return res.status(400).json({ msg: "File and user required" });
    }

    if (!apiKey) {
      return res.status(500).json({ msg: "Speechmatics API key not configured" });
    }

    // Crear cliente de Speechmatics
    const client = new BatchClient({ apiKey, appId: 'Vocali-Transcriptions' });
    
    // Convertir archivo a blob y crear File object
    const fileBlob = await openAsBlob(fileReceived.path);
    const file = new File([fileBlob], fileReceived.originalname);

    // Transcribir audio
    const transcriptionResult = await client.transcribe(
      file,
      {
        transcription_config: {
          language: 'es',
        },
      },
      'json-v2',
    );

    // Extraer el texto de la respuesta de Speechmatics
    let transcribedText = '';
    if (typeof transcriptionResult === 'object' && transcriptionResult && 'results' in transcriptionResult) {
      const results = (transcriptionResult as any).results;
      if (Array.isArray(results)) {
        transcribedText = results
          .map((result: any) => result.alternatives?.[0]?.content || '')
          .join(' ');
      }
    }
    
    // Fallback si no se pudo extraer el texto
    if (!transcribedText) {
      transcribedText = typeof transcriptionResult === 'string' 
        ? transcriptionResult 
        : JSON.stringify(transcriptionResult);
    }

    // Guardar en base de datos
    const transcript = await Transcript.create({
      owner: user.id,
      filename: fileReceived.originalname,
      text: transcribedText,
    });

    res.status(201).json({
      success: true,
      transcript: {
        id: transcript._id,
        filename: transcript.filename,
        text: transcript.text,
        createdAt: transcript.createdAt
      }
    });

  } catch (error) {
    console.error('Transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      msg: "Error processing transcription", 
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    });
  }
};