import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { VehicleService } from './vehicle.service';

const createVehicle = catchAsync(async (req: Request, res: Response) => {
  const result = await VehicleService.createVehicle(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Vehicle created successfully',
    data: result,
  });
});

const getAllVehicles = catchAsync(async (req: Request, res: Response) => {
  const result = await VehicleService.getAllVehicles(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vehicles retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getVehicleById = catchAsync(async (req: Request, res: Response) => {
  const result = await VehicleService.getVehicleById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vehicle retrieved successfully',
    data: result,
  });
});

const updateVehicle = catchAsync(async (req: Request, res: Response) => {
  const result = await VehicleService.updateVehicle(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vehicle updated successfully',
    data: result,
  });
});

const updateVehicleStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await VehicleService.updateVehicleStatus(req.params.id, req.body.status);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vehicle status updated successfully',
    data: result,
  });
});

const deleteVehicle = catchAsync(async (req: Request, res: Response) => {
  const result = await VehicleService.deleteVehicle(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vehicle deleted successfully',
    data: result,
  });
});

export const VehicleController = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
};
