import { Router } from "express";
import {
  getNotifications,
  createNotification,
  markAllRead,
  markSingleRead,
} from "../controllers/notifications.controller";

const router: Router = Router();

router.get("/", getNotifications);
router.post("/", createNotification);
router.patch("/mark-all-read", markAllRead);
router.patch("/:id/read", markSingleRead);

export default router;
