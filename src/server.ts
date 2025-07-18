import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import transcribeRoutes from "./routes/transcribe.routes";
import historyRoutes from "./routes/history.routes";
import { setupRealtimeTranscription } from "./controllers/realtime.controller";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*", // Adjust for production
  },
});

app.use(cors());
app.use(express.json());
app.use(helmet());

app.use("/api/auth", authRoutes);
app.use("/api/transcribe", transcribeRoutes);
app.use("/api/history", historyRoutes);

setupRealtimeTranscription(io);

app.use("/files", express.static("uploads")); // descarga de transcripciones

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`API running on ${PORT}`));

export default app;