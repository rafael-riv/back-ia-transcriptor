import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, unique: true },
    password: String,
  },
  { timestamps: true }
);

export default model("User", UserSchema);
