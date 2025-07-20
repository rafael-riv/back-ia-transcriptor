import { Router } from "express";
import { isAuth } from "../middlewares/auth";
import { 
  listHistory, 
  getStatistics, 
  deleteTranscription, 
  getTranscription 
} from "../controllers/history.controller";

const router = Router();

// GET /api/history - Listar historial con paginación y filtros
router.get("/", isAuth, listHistory);

// GET /api/history/stats - Obtener estadísticas del historial
router.get("/stats", isAuth, getStatistics);

// GET /api/history/:id - Obtener una transcripción específica
router.get("/:id", isAuth, getTranscription);

// DELETE /api/history/:id - Eliminar una transcripción
router.delete("/:id", isAuth, deleteTranscription);

export default router;