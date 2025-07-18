import { Router } from "express";
import multer from "multer";
import { isAuth } from "../middlewares/auth";
import { createTranscript, saveRealtimeTranscript } from "../controllers/transcribe.controller";

const upload = multer({ dest: "uploads/" });
const router = Router();

router.post("/", isAuth, upload.single("audio"), createTranscript);
router.post("/realtime", isAuth, saveRealtimeTranscript);

export default router;