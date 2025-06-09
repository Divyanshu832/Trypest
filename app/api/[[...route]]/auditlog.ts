import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import db from "@/lib/prisma";

// Create AuditLog Schema
const AuditLogSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["CREATE", "UPDATE", "DELETE"]),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  details: z.any(), // You can add more specific structure if needed
});

const app = new Hono()

  // Get all audit logs
  .get("/", async (c) => {
    try {
      const logs = await db.auditLog.findMany({
        orderBy: { timestamp: "desc" },
        include: { user: true }, // optional, if you want user details
      });
      return c.json({ success: true, logs });
    } catch (error) {
      return c.json({ error: "Failed to fetch audit logs" }, 500);
    }
  })

  // Create an audit log entry
  .post("/", zValidator("json", AuditLogSchema), async (c) => {
    try {
      const data = c.req.valid("json");

      const newLog = await db.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          details: data.details,
        },
      });

      return c.json({ success: true, log: newLog }, 201);
    } catch (error) {
      return c.json({ error: "Failed to create audit log" }, 500);
    }
  })

  // Get a specific audit log
  .get("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const log = await db.auditLog.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!log) return c.json({ error: "Audit log not found" }, 404);
      return c.json({ success: true, log });
    } catch (error) {
      return c.json({ error: "Failed to fetch audit log" }, 500);
    }
  })

  // Delete a specific audit log
  .delete("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const log = await db.auditLog.findUnique({ where: { id } });

      if (!log) return c.json({ error: "Audit log not found" }, 404);

      await db.auditLog.delete({ where: { id } });

      return c.json({ success: true, message: "Audit log deleted successfully" });
    } catch (error) {
      return c.json({ error: "Failed to delete audit log" }, 500);
    }
  });

export default app;
