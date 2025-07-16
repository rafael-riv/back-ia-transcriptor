import { Router } from "express";
import multer from "multer";
import { isAuth } from "../middlewares/auth";
import { createTranscript } from "../controllers/transcribe.controller";

const upload = multer({ dest: "uploads/" });
const router = Router();

router.post("/", isAuth, upload.single("audio"), createTranscript);
export default router;