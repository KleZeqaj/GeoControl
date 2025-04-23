import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUser
} from "@controllers/userController";
import { UserFromJSON } from "@dto/User";

const router = Router();

// Get all users (Admin only)
router.get("", authenticateUser([UserType.Admin]), async (req, res, next) => {
  try {
    res.status(200).json(await getAllUsers());
  } catch (error) {
    next(error);
  }
});

// Create user (Admin only)
router.post("", authenticateUser([UserType.Admin]), async (req, res, next) => {
  try {
    await createUser(UserFromJSON(req.body));
    res.status(201).send();
  } catch (error) {
    next(error);
  }
});

// Get user by username (Admin only)
router.get(
  "/:userName",
  authenticateUser([UserType.Admin]),
  async (req, res, next) => {
    try {
      res.status(200).json(await getUser(req.params.userName));
    } catch (error) {
      next(error);
    }
  }
);

// Delete user (Admin only)
router.delete(
  "/:userName",
  authenticateUser([UserType.Admin]),
  async (req, res, next) => {
    try {
      await deleteUser(req.params.userName);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
