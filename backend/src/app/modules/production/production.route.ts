import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ProductionController } from './production.controller';
import { ProductionValidation } from './production.validation';

const router = express.Router();

router.get(
  '/summary',
  auth('ADMIN'),
  ProductionController.getProductionSummary
);

router.post(
  '/',
  auth('ADMIN'),
  validateRequest(ProductionValidation.createProductionSchema),
  ProductionController.createProduction
);

router.get(
  '/',
  auth('ADMIN'),
  ProductionController.getAllProduction
);

router.get(
  '/:id',
  auth('ADMIN'),
  ProductionController.getProductionById
);

router.patch(
  '/:id',
  auth('ADMIN'),
  validateRequest(ProductionValidation.updateProductionSchema),
  ProductionController.updateProduction
);

router.delete(
  '/:id',
  auth('ADMIN'),
  ProductionController.deleteProduction
);

export const ProductionRoutes = router;
