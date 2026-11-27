import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { TripService } from './trip.service';

const createTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.createTrip(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Trip booked successfully',
    data: result,
  });
});

const getAllTrips = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.getAllTrips(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trips retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getTripById = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.getTripById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trip details retrieved successfully',
    data: result,
  });
});

const updateTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.updateTrip(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trip updated successfully',
    data: result,
  });
});

const dispatchTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.dispatchTrip(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trip dispatched successfully',
    data: result,
  });
});

const completeTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.completeTrip(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trip completed successfully',
    data: result,
  });
});

const cancelTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.cancelTrip(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trip cancelled successfully',
    data: result,
  });
});

const getVehicleAvailability = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.getVehicleAvailability(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Available vehicles retrieved successfully',
    data: result,
  });
});

export const TripController = {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getVehicleAvailability,
};
