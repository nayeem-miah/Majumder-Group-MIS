import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StyleService } from './style.service';

const createStyle = catchAsync(async (req: Request, res: Response) => {
  const result = await StyleService.createStyle(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Style created successfully',
    data: result,
  });
});

const getAllStyles = catchAsync(async (req: Request, res: Response) => {
  const result = await StyleService.getAllStyles(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Styles retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getStyleById = catchAsync(async (req: Request, res: Response) => {
  const result = await StyleService.getStyleById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Style details retrieved successfully',
    data: result,
  });
});

const updateStyle = catchAsync(async (req: Request, res: Response) => {
  const result = await StyleService.updateStyle(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Style updated successfully',
    data: result,
  });
});

const deleteStyle = catchAsync(async (req: Request, res: Response) => {
  const result = await StyleService.deleteStyle(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Style deleted successfully',
    data: result,
  });
});

export const StyleController = {
  createStyle,
  getAllStyles,
  getStyleById,
  updateStyle,
  deleteStyle,
};
