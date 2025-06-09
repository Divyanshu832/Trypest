import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import db from "@/lib/prisma";

// Validation schema for order series creation
const OrderSeriesSchema = z.object({
  prefix: z.string()
    .min(2, "Prefix must be at least 2 characters")
    .regex(/^[A-Z0-9-]+$/, "Prefix must contain only uppercase letters, numbers, and hyphens"),
  suffix: z.string()
    .min(1, "Suffix must be at least 1 character")
    .regex(/^[A-Z0-9-]+$/, "Suffix must contain only uppercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().min(5, "Description must be at least 5 characters").optional(),
  startNumber: z.number().min(1, "Start number must be at least 1").optional().default(1),
  isDefault: z.boolean().optional(),
});

// Schema for updating order series
const OrderSeriesUpdateSchema = z.object({
  prefix: z.string().optional(),
  suffix: z.string().optional(), 
  description: z.string().optional(),
  startNumber: z.number().min(1).optional(),
  isDefault: z.boolean().optional(),
});

const app = new Hono()
  // Get all order series
  .get("/", async (c) => {
    try {
      const allSeries = await db.orderSeries.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      return c.json({ success: true, series: allSeries });
    } catch (error) {
      console.error("Error fetching order series:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch order series";
      return c.json({ error: message }, 500);
    }
  })
  // Create new order series
  .post("/", zValidator("json", OrderSeriesSchema), async (c) => {
    try {
      const { prefix, suffix, description, startNumber } = c.req.valid("json");

      const existingSeries = await db.orderSeries.findUnique({
        where: { prefix },
      });

      if (existingSeries) {
        return c.json({ error: "A series with this prefix already exists" }, 409);
      }

      const seriesCount = await db.orderSeries.count();      const newSeries = await db.orderSeries.create({
        data: {
          prefix,
          suffix,
          description: description || "",
          isDefault: seriesCount === 0,
          startNumber: startNumber || 1,
          lastNumber: 0,
        },
      });

      return c.json({ success: true, series: newSeries }, 201);
    } catch (error) {
      console.error("Error creating order series:", error);
      const message = error instanceof Error ? error.message : "Failed to create order series";
      return c.json({ error: message }, 500);
    }
  })

  // Set a default order series
  .patch("/:id", zValidator("json", OrderSeriesUpdateSchema), async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const series = await db.orderSeries.findUnique({ where: { id } });

      if (!series) {
        return c.json({ error: "Series not found" }, 404);
      }

      await db.$transaction([
        db.orderSeries.updateMany({
          data: { isDefault: false },
        }),
        db.orderSeries.update({
          where: { id },
          data: { isDefault: true },
        }),
      ]);

      return c.json({ success: true, message: "Default order series updated successfully" });
    } catch (error) {
      console.error("Error updating default order series:", error);
      const message = error instanceof Error ? error.message : "Failed to update default order series";
      return c.json({ error: message }, 500);
    }
  })

  // Delete an order series
  .delete("/:id", async (c) => {
    try {
      const id = c.req.param("id");

      if (!id) {
        return c.json({ error: "Series ID is required" }, 400);
      }

      const series = await db.orderSeries.findUnique({ where: { id } });

      if (!series) {
        return c.json({ error: "Series not found" }, 404);
      }

      if (series.isDefault) {
        return c.json({ error: "Cannot delete the default series" }, 400);
      }

      await db.orderSeries.delete({ where: { id } });

      return c.json({ success: true, message: "Order series deleted successfully" });
    } catch (error) {
      console.error("Error deleting order series:", error);
      const message = error instanceof Error ? error.message : "Failed to delete order series";
      return c.json({ error: message }, 500);
    }
  });

export default app;
