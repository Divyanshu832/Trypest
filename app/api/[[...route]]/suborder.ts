import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import db from "@/lib/prisma";

// Validation schemas
const SubOrderCreateSchema = z.object({
  name: z.string().min(1, "SubOrder name is required"),
  description: z.string().optional(),
  orderId: z.string().min(1, "Order ID is required"),
});

const SubOrderUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const app = new Hono()

  // 🔹 GET all suborders for a specific order
  .get("/order/:orderId", async (c) => {
    try {
      const orderId = c.req.param("orderId");
      const subOrders = await db.subOrder.findMany({
        where: { orderId },
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: {
              orderNumber: true,
              description: true,
            },
          },
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      });
      return c.json({ success: true, subOrders });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch suborders";
      return c.json({ error: message }, 500);
    }
  })

  // 🔹 GET all suborders
  .get("/", async (c) => {
    try {
      const subOrders = await db.subOrder.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: {
              orderNumber: true,
              description: true,
            },
          },
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      });
      return c.json({ success: true, subOrders });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch suborders";
      return c.json({ error: message }, 500);
    }
  })

  // 🔹 GET suborder by ID
  .get("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const subOrder = await db.subOrder.findUnique({ 
        where: { id },
        include: {
          order: {
            select: {
              orderNumber: true,
              description: true,
            },
          },
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      });

      if (!subOrder) {
        return c.json({ error: "SubOrder not found" }, 404);
      }

      return c.json({ success: true, subOrder });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch suborder";
      return c.json({ error: message }, 500);
    }
  })

  // 🔹 POST create new suborder
  .post("/", zValidator("json", SubOrderCreateSchema), async (c) => {
    try {
      const { name, description, orderId } = c.req.valid("json");

      // Check if order exists
      const order = await db.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return c.json({ error: "Order not found" }, 404);
      }

      const subOrder = await db.subOrder.create({
        data: {
          name,
          description,
          orderId,
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              description: true,
            },
          },
        },
      });

      return c.json({ success: true, subOrder }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create suborder";
      return c.json({ error: message }, 500);
    }
  })

  // 🔹 PATCH update suborder by ID
  .patch("/:id", zValidator("json", SubOrderUpdateSchema), async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const subOrder = await db.subOrder.findUnique({ where: { id } });
      if (!subOrder) return c.json({ error: "SubOrder not found" }, 404);

      const updatedSubOrder = await db.subOrder.update({ 
        where: { id }, 
        data,
        include: {
          order: {
            select: {
              orderNumber: true,
              description: true,
            },
          },
        },
      });
      return c.json({ success: true, subOrder: updatedSubOrder });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update suborder";
      return c.json({ error: message }, 500);
    }
  })

  // 🔹 DELETE suborder by ID
  .delete("/:id", async (c) => {
    try {
      const id = c.req.param("id");

      const subOrder = await db.subOrder.findUnique({ where: { id } });
      if (!subOrder) return c.json({ error: "SubOrder not found" }, 404);

      // Check if there are any transactions associated with this suborder
      const transactionCount = await db.transaction.count({
        where: { subOrderId: id },
      });

      if (transactionCount > 0) {
        return c.json({ 
          error: "Cannot delete suborder with associated transactions" 
        }, 400);
      }

      await db.subOrder.delete({ where: { id } });
      return c.json({ success: true, message: "SubOrder deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete suborder";
      return c.json({ error: message }, 500);
    }
  });

export default app;
