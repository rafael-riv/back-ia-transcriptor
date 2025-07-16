import Transcript from "../models/Transcript";
import { Request, Response } from "express";

// opcional: Speechmatics SDK aquí
export const createTranscript = async (req: Request, res: Response) => {
  const file = (req as any).file;
  const user = (req as any).user;
  
  if (!file || !user) {
    return res.status(400).json({ msg: "File and user required" });
  }
  
  // 🔧 Lógica real: envía a Speechmatics y espera respuesta
  const fakeText = "Texto transcrito de prueba"; // Mock
  const trans = await Transcript.create({
    owner: user.id,
    filename: file.filename,
    text: fakeText,
  });
  res.status(201).json(trans);
};