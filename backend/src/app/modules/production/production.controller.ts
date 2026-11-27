import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ProductionService } from './production.service';

const createProduction = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductionService.createProduction(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Production entry created successfully',
    data: result,
  });
});

const getAllProduction = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductionService.getAllProduction(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Production entries retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getProductionById = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductionService.getProductionById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Production entry retrieved successfully',
    data: result,
  });
});

const updateProduction = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductionService.updateProduction(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Production entry updated successfully',
    data: result,
  });
});

const deleteProduction = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductionService.deleteProduction(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Production entry deleted successfully',
    data: result,
  });
});

const getProductionSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductionService.getProductionSummary(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Production summary retrieved successfully',
    data: result,
  });
});

export const ProductionController = {
  createProduction,
  getAllProduction,
  getProductionById,
  updateProduction,
  deleteProduction,
  getProductionSummary,
};
