import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { StyleController } from './style.controller';
import { StyleValidation } from './style.validation';

const router = express.Router();

router.post(
  '/',
  auth('ADMIN'),
  validateRequest(StyleValidation.createStyleSchema),
  StyleController.createStyle
);

router.get(
  '/',
  auth('ADMIN'),
  StyleController.getAllStyles
);

router.get(
  '/:id',
  auth('ADMIN'),
  StyleController.getStyleById
);

router.patch(
  '/:id',
  auth('ADMIN'),
  validateRequest(StyleValidation.updateStyleSchema),
  StyleController.updateStyle
);

router.delete(
  '/:id',
  auth('ADMIN'),
  StyleController.deleteStyle
);

export const StyleRoutes = router;
