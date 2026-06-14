import { Request, Response } from "express";

// ─── Types ────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: 'fix_created' | 'run_failed' | 'run_passed';
  title: string;
  body: string;
  link: string;
  read: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const success = (res: Response, data: unknown, status = 200): void => {
  res.status(status).json({ success: true, data });
};

const fail = (
  res: Response,
  code: string,
  message: string,
  statusCode: number
): void => {
  res.status(statusCode).json({ success: false, error: { code, message, statusCode } });
};

// Store notifications in memory (in production, use database)
const notificationsStore: Notification[] = [];

// ─── GET /notifications ───────────────────────────────────────────────────────

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    success(res, notificationsStore);
  } catch (error) {
    console.error("[notifications] Error fetching notifications:", error);
    fail(res, "FETCH_ERROR", "Failed to fetch notifications", 500);
  }
};

// ─── POST /notifications ──────────────────────────────────────────────────────

export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, title, body, link } = req.body as {
      type: 'fix_created' | 'run_failed' | 'run_passed';
      title: string;
      body: string;
      link: string;
    };

    if (!type || !title || !body || !link) {
      fail(res, "MISSING_FIELD", "type, title, body, and link are required", 400);
      return;
    }

    const notification: Notification = {
      id: `notif_${Date.now()}`,
      type,
      title,
      body,
      link,
      read: false,
      created_at: new Date().toISOString(),
    };

    notificationsStore.unshift(notification); // Add to beginning

    success(res, notification, 201);
  } catch (error) {
    console.error("[notifications] Error creating notification:", error);
    fail(res, "CREATE_ERROR", "Failed to create notification", 500);
  }
};

// ─── PATCH /notifications/mark-all-read ──────────────────────────────────────

export const markAllRead = async (req: Request, res: Response): Promise<void> => {
  try {
    notificationsStore.forEach((notification) => {
      notification.read = true;
    });

    success(res, { message: "All notifications marked as read" });
  } catch (error) {
    console.error("[notifications] Error marking all as read:", error);
    fail(res, "UPDATE_ERROR", "Failed to mark notifications as read", 500);
  }
};

// ─── PATCH /notifications/:id/read ────────────────────────────────────────────

export const markSingleRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const notification = notificationsStore.find((n) => n.id === id);
    if (!notification) {
      fail(res, "NOT_FOUND", `Notification ${id} not found`, 404);
      return;
    }

    notification.read = true;

    success(res, notification);
  } catch (error) {
    console.error("[notifications] Error marking single as read:", error);
    fail(res, "UPDATE_ERROR", "Failed to mark notification as read", 500);
  }
};
