import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import db from "@/lib/prisma";

// Validation schemas
const OrderCreateSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  description: z.string().min(5, "Description must be at least 5 characters").optional(),
  amount: z.number().positive("Amount must be a positive number"),
  orderSeriesId: z.string().min(1, "Order series ID is required"),
  status: z.enum(["ACTIVE", "CANCELLED", "COMPLETED"]).optional(),
});

const OrderUpdateSchema = z.object({
  description: z.string().min(5).optional(),
  amount: z.number().positive().optional(),
  status: z.enum(["ACTIVE", "CANCELLED", "COMPLETED"]).optional(),
});

const app = new Hono()

  // 🔹 GET all orders
  .get("/", async (c) => {
    try {
      const orders = await db.order.findMany({
        orderBy: { createdAt: "desc" },
      });
      return c.json({ success: true, orders });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch orders";
      return c.json({ error: message }, 500);
    }
  })

  // 🔹 GET order by ID
  .get("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const order = await db.order.findUnique({ where: { id } });

      if (!order) {
        return c.json({ error: "Order not found" }, 404);
      }

      return c.json({ success: true, order });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch order";
      return c.json({ error: message }, 500);
    }
  })

  // 🔹 POST create new order (auto-generates order number)
  .post("/", zValidator("json", OrderCreateSchema.omit({ orderNumber: true })), async (c) => {
    try {
      const { description, amount, orderSeriesId, status = "ACTIVE" } = c.req.valid("json");

      const orderSeries = await db.orderSeries.findUnique({
        where: { id: orderSeriesId },
      });

      if (!orderSeries) {
        return c.json({ error: "Order series not found" }, 404);
      }      // Calculate the next order number based on startNumber
      const nextNumber = Math.max(orderSeries.lastNumber + 1, orderSeries.startNumber || 1);
      
      // Format: prefix-ordernumber-suffix
      let orderNumber = `${orderSeries.prefix}-${String(nextNumber).padStart(3, "0")}`;
      if (orderSeries.suffix) {
        orderNumber += `-${orderSeries.suffix}`;
      }

      const result = await db.$transaction(async (tx) => {        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            description: description || "",
            amount,
            status,
            orderSeriesId,
          },
        });

        await tx.orderSeries.update({
          where: { id: orderSeriesId },
          data: { lastNumber: nextNumber },
        });

        return newOrder;
      });

      return c.json({ success: true, order: result }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create order";
      return c.json({ error: message }, 500);
    }
  })

  // 🔹 PATCH update order by ID
  .patch("/:id", zValidator("json", OrderUpdateSchema), async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const order = await db.order.findUnique({ where: { id } });
      if (!order) return c.json({ error: "Order not found" }, 404);

      const updatedOrder = await db.order.update({ where: { id }, data });
      return c.json({ success: true, order: updatedOrder });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update order";
      return c.json({ error: message }, 500);
    }
  })

  // 🔹 DELETE order by ID
  .delete("/:id", async (c) => {
    try {
      const id = c.req.param("id");

      const order = await db.order.findUnique({ where: { id } });
      if (!order) return c.json({ error: "Order not found" }, 404);

      await db.order.delete({ where: { id } });
      return c.json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete order";
      return c.json({ error: message }, 500);
    }
  });

export default app;
