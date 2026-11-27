import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { StyleRoutes } from "../modules/style/style.route";
import { ProductionRoutes } from "../modules/production/production.route";
import { VehicleRoutes } from "../modules/vehicle/vehicle.route";
import { TripRoutes } from "../modules/trip/trip.route";
import { DashboardRoutes } from "../modules/dashboard/dashboard.route";

const router = Router();

router.use("/users", UserRoutes);
router.use("/auth", AuthRoutes);
router.use("/styles", StyleRoutes);
router.use("/production", ProductionRoutes);
router.use("/vehicles", VehicleRoutes);
router.use("/trips", TripRoutes);
router.use("/dashboard", DashboardRoutes);

export default router;