import express from 'express';
import auth from '../../middlewares/auth';
import { DashboardController } from './dashboard.controller';

const router = express.Router();

router.get(
  '/summary',
  auth('ADMIN'),
  DashboardController.getDashboardSummary
);

export const DashboardRoutes = router;
