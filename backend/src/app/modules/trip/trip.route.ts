import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { TripController } from './trip.controller';
import { TripValidation } from './trip.validation';

const router = express.Router();

router.get(
  '/availability',
  auth('ADMIN'),
  TripController.getVehicleAvailability
);

router.post(
  '/',
  auth('ADMIN'),
  validateRequest(TripValidation.createTripSchema),
  TripController.createTrip
);

router.get(
  '/',
  auth('ADMIN'),
  TripController.getAllTrips
);

router.get(
  '/:id',
  auth('ADMIN'),
  TripController.getTripById
);

router.patch(
  '/:id',
  auth('ADMIN'),
  validateRequest(TripValidation.updateTripSchema),
  TripController.updateTrip
);

router.patch(
  '/:id/dispatch',
  auth('ADMIN'),
  TripController.dispatchTrip
);

router.patch(
  '/:id/complete',
  auth('ADMIN'),
  TripController.completeTrip
);

router.patch(
  '/:id/cancel',
  auth('ADMIN'),
  TripController.cancelTrip
);

export const TripRoutes = router;
