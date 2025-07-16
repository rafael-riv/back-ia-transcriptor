import { Router } from "express";
import { isAuth } from "../middlewares/auth";
import { listHistory } from "../controllers/history.controller";
const router = Router();
router.get("/", isAuth, listHistory);
export default router;