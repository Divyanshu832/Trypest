import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import db from "@/lib/prisma";

const ExpenseCategorySchema = z.object({
  name: z.string().min(2), // Name is required
  description: z.string().min(3).optional(), // Make description optional
  isActive: z.boolean().optional(), // isActive is optional
});

const ExpenseCategoryUpdateSchema = z.object({
  name: z.string().min(2).optional(), // Name is optional for updates
  description: z.string().min(3).optional(), // Make description optional
  isActive: z.boolean().optional(), // isActive is optional
});

const app = new Hono()

  // GET all categories
  .get("/", async (c) => {
    try {
      const categories = await db.expenseCategory.findMany({
        orderBy: { createdAt: "desc" },
      });
      return c.json({ success: true, categories });
    } catch {
      return c.json({ error: "Failed to fetch categories" }, 500);
    }
  })

  // POST new category
  .post("/", zValidator("json", ExpenseCategorySchema), async (c) => {
    try {
      const data = c.req.valid("json");

      const created = await db.expenseCategory.create({
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive ?? true,
        },
      });

      return c.json({ success: true, category: created }, 201);
    } catch (error) {
      return c.json({ error: "Failed to create category" }, 500);
    }
  })

  // GET single category
  .get("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const category = await db.expenseCategory.findUnique({ where: { id } });

      if (!category) return c.json({ error: "Category not found" }, 404);

      return c.json({ success: true, category });
    } catch {
      return c.json({ error: "Failed to fetch category" }, 500);
    }
  })

  // PATCH update category
  .patch("/:id", zValidator("json", ExpenseCategoryUpdateSchema), async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const updated = await db.expenseCategory.update({
        where: { id },
        data,
      });

      return c.json({ success: true, category: updated });
    } catch {
      return c.json({ error: "Failed to update category" }, 500);
    }
  })

  // DELETE category
  .delete("/:id", async (c) => {
    try {
      const id = c.req.param("id");

      const category = await db.expenseCategory.findUnique({ where: { id } });
      if (!category) return c.json({ error: "Category not found" }, 404);

      await db.expenseCategory.delete({ where: { id } });

      return c.json({ success: true, message: "Category deleted" });
    } catch {
      return c.json({ error: "Failed to delete category" }, 500);
    }
  })
// TOGGLE active status
.patch("/:id/toggle", async (c) => {
  try {
    const id = c.req.param("id");

    const existing = await db.expenseCategory.findUnique({ where: { id } });
    if (!existing) return c.json({ error: "Category not found" }, 404);

    const updated = await db.expenseCategory.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return c.json({ success: true, category: updated });
  } catch {
    return c.json({ error: "Failed to toggle category status" }, 500);
  }
});



export default app;
