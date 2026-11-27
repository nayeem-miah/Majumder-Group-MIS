import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { StyleRoutes } from "../modules/style/style.route";
import { ProductionRoutes } from "../modules/production/production.route";

const router = Router();

router.use("/users", UserRoutes);
router.use("/auth", AuthRoutes);
router.use("/styles", StyleRoutes);
router.use("/production", ProductionRoutes);

export default router;