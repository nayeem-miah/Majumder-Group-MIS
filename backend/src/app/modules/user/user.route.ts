import express from "express";
import { USER_ROLES } from "../../constants/roles";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { userValidation } from "./user.validation";

const router = express.Router();

// Existing routes
router.post(
    "/",
    validateRequest(userValidation.createUserValidationSchema),
    UserController.createUser
);

router.patch(
    "/update-profile",
    auth(USER_ROLES.USER, USER_ROLES.ADMIN),
    validateRequest(userValidation.updateUserValidationSchema),
    UserController.userUpdateProfile
);

// Get current user (protected)
router.get("/me", auth(USER_ROLES.USER, USER_ROLES.ADMIN), UserController.getSingleUser);

// FIND USER BY ID (protected)
router.get("/:id", auth(USER_ROLES.ADMIN), UserController.getFindUserById);

// GET ALL USERS (protected)
router.get("/", auth(USER_ROLES.ADMIN), UserController.getAllUsers);

// DELETE USER BY ID (protected)
router.delete("/:id", auth(USER_ROLES.ADMIN), UserController.deleteUser);

export const UserRoutes = router;
