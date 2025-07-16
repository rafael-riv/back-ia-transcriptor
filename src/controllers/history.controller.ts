import Transcript from "../models/Transcript";
import { Request, Response } from "express";

export const listHistory = async (req: Request, res: Response) => {
  const page = Number((req as any).query.page) || 1;
  const docs = await Transcript.find({ owner: (req as any).user.id })
    .skip((page - 1) * 10)
    .limit(10);
  res.json(docs);
};
