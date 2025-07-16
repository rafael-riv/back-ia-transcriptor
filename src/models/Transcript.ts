import { Schema, model } from "mongoose";

const TranscriptSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    filename: String,
    text: String,
  },
  { timestamps: true }
);

export default model("Transcript", TranscriptSchema); 