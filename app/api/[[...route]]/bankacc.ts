import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import db from "@/lib/prisma";

// Create Schema
const BankAccountSchema = z.object({
  bankName: z.string().min(2),
  accountNumber: z.string().min(6),
  ifsccode: z.string().min(5),
  branchName: z.string().min(2),
  isDefault: z.boolean().optional(),
});

// Update Schema
const BankAccountUpdateSchema = z.object({
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifsccode: z.string().optional(),
  branchName: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const app = new Hono()

  // Get all bank accounts
  .get("/", async (c) => {
    try {
      const accounts = await db.bankAccount.findMany({
        orderBy: { createdAt: "desc" },
      });
      return c.json({ success: true, accounts });
    } catch (error) {
      return c.json({ error: "Failed to fetch bank accounts" }, 500);
    }
  })

  // Create new bank account
  .post("/", zValidator("json", BankAccountSchema), async (c) => {
    try {
      const data = c.req.valid("json");

      if (data.isDefault) {
        // Unset all other defaults
        await db.bankAccount.updateMany({ data: { isDefault: false } });
      }

      const newAccount = await db.bankAccount.create({
        data: {
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          ifsccode: data.ifsccode,
          branchName: data.branchName,
          isDefault: data.isDefault || false,
        },
      });

      return c.json({ success: true, account: newAccount }, 201);
    } catch (error) {
      return c.json({ error: "Failed to create bank account" }, 500);
    }
  })

  // Set bank account as default
  .patch("/:id/default", async (c) => {
    try {
      const id = c.req.param("id");

      const account = await db.bankAccount.findUnique({ where: { id } });
      if (!account) return c.json({ error: "Account not found" }, 404);

      await db.$transaction([
        db.bankAccount.updateMany({ data: { isDefault: false } }),
        db.bankAccount.update({ where: { id }, data: { isDefault: true } }),
      ]);

      return c.json({ success: true, message: "Default account updated" });
    } catch (error) {
      return c.json({ error: "Failed to update default account" }, 500);
    }
  })

  // Update a bank account
  .patch("/:id", zValidator("json", BankAccountUpdateSchema), async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      if (data.isDefault) {
        await db.bankAccount.updateMany({ data: { isDefault: false } });
      }

      const updated = await db.bankAccount.update({
        where: { id },
        data,
      });

      return c.json({ success: true, account: updated });
    } catch (error) {
      return c.json({ error: "Failed to update account" }, 500);
    }
  })

  // Delete a bank account
  .delete("/:id", async (c) => {
    try {
      const id = c.req.param("id");

      const account = await db.bankAccount.findUnique({ where: { id } });
      if (!account) return c.json({ error: "Account not found" }, 404);

      if (account.isDefault) {
        return c.json({ error: "Cannot delete default account" }, 400);
      }

      await db.bankAccount.delete({ where: { id } });

      return c.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      return c.json({ error: "Failed to delete account" }, 500);
    }
  });

export default app;
