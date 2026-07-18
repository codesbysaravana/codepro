import { Router } from "express";
import { signup, login } from "../controllers/authController.js";

const router = Router();

router.post("/api/auth/signup", signup);
router.post("/api/auth/login", login);

export default router;
