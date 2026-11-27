/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs";
import { Request } from "express";
import ApiError from "../../errors/apiError";
import { USER_ROLES } from "../../constants/roles";

// Temporary fallback stubs for legacy user CRUD during PostgreSQL migration
const createUser = async (req: Request) => {
  const { email, password, name, role } = req.body;
  if (!password) {
    throw new ApiError(400, "Password is required");
  }
  const hashPassword = await bcrypt.hash(password, 10);
  return {
    name,
    email,
    role: role || USER_ROLES.USER,
    password: hashPassword,
  };
};

const findUserById = async (id: string) => {
  return { id, name: "Sample User" };
};

const getAllUsers = async (query: Record<string, any>) => {
  return {
    meta: { page: 1, limit: 10, total: 0 },
    data: [],
  };
};

const getSingleUser = async (userId: string) => {
  return { id: userId };
};

const userUpdateProfile = async (userId: string, payload: any) => {
  return { id: userId, ...payload };
};

const deleteUser = async (userId: string) => {
  return { id: userId, deleted: true };
};

export const UserService = {
  createUser,
  getAllUsers,
  findUserById,
  getSingleUser,
  userUpdateProfile,
  deleteUser,
};
