import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { VehicleController } from './vehicle.controller';
import { VehicleValidation } from './vehicle.validation';

const router = express.Router();

router.post(
  '/',
  auth('ADMIN'),
  validateRequest(VehicleValidation.createVehicleSchema),
  VehicleController.createVehicle
);

router.get(
  '/',
  auth('ADMIN'),
  VehicleController.getAllVehicles
);

router.get(
  '/:id',
  auth('ADMIN'),
  VehicleController.getVehicleById
);

router.patch(
  '/:id',
  auth('ADMIN'),
  validateRequest(VehicleValidation.updateVehicleSchema),
  VehicleController.updateVehicle
);

router.patch(
  '/:id/status',
  auth('ADMIN'),
  validateRequest(VehicleValidation.updateVehicleStatusSchema),
  VehicleController.updateVehicleStatus
);

router.delete(
  '/:id',
  auth('ADMIN'),
  VehicleController.deleteVehicle
);

export const VehicleRoutes = router;
