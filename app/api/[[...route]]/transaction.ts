import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import db from "@/lib/prisma";

// Enums from Prisma schema
const PaymentMethodEnum = z.enum(["CASH", "BANK"]);
const TransactionTypeEnum = z.enum(["IMPREST", "EXPENSE"]);
const TransactionStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);

// Validation schemas
const TransactionCreateSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  type: TransactionTypeEnum,
  senderId: z.string().min(1),
  receiverId: z.string().min(1),
  remark: z.string(),
  paymentMethod: PaymentMethodEnum,
  bankAccountId: z.string().optional(),
  orderId: z.string().optional(),
  subOrderId: z.string().optional(),
  expenseCategoryId: z.string().optional(),
  hasInvoice: z.boolean().optional(),
  invoiceUrl: z.string().url().optional(),
  entryDate: z.coerce.date(),
  transactionDate: z.coerce.date(),
  status: TransactionStatusEnum.optional(),
  createdBy: z.string().min(1),
});

const TransactionUpdateSchema = TransactionCreateSchema.partial();

const app = new Hono()
  // GET all transactions
  .get("/", async (c) => {
    const userId = c.get("authUser")?.token?.id
    try {
      const transactions = await db.transaction.findMany({
        where :{
          senderId:userId,
          createdBy:userId,
        },
        orderBy: { createdAt: "desc" },
        include: {
          // sender: true,
          // creator: true,
          bankAccount: true,
          order: true,
          subOrder: true,
          expenseCategory: true,
        },
      });
      return c.json({ success: true, transactions });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to fetch transactions" }, 500);
    }
  })
  // GET transaction by ID
  .get("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const transaction = await db.transaction.findUnique({
        where: { id },
        include: {
          sender: true,
          creator: true,
          bankAccount: true,
          order: true,
          subOrder: true,
          expenseCategory: true,
        },
      });

      if (!transaction) {
        return c.json({ error: "Transaction not found" }, 404);
      }

      return c.json({ success: true, transaction });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to fetch transaction" }, 500);
    }
  })
  // POST create new transaction
  .post("/", zValidator("json", TransactionCreateSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      
      // Get the default sender ID series for the prefix
      const seriesData = await db.senderIdSeries.findFirst({
        where: { isDefault: true },
      });
      
      if (!seriesData) {
        return c.json({ error: "No default sender ID series found" }, 500);
      }
      
      // Get creator user details
      const creator = await db.user.findUnique({
        where: { id: data.createdBy },
      });
      
      if (!creator) {
        return c.json({ error: "Creator user not found" }, 500);
      }
      
      // Extract first name - take the first part of the name
      const firstName = creator.name.split(' ')[0].toUpperCase();
        // Format role abbreviation
      let roleAbbr = "EMP";
      if (creator.role) {
        const role = creator.role.toString().toUpperCase();
        if (role.includes("ADMIN")) {
          roleAbbr = "ADMIN";
        } else if (role.includes("ACCOUNTANT") || role === "ACC") {
          roleAbbr = "ACC";
        } else if (role.includes("EMPLOYEE") || role === "EMP") {
          roleAbbr = "EMP";
        }
      }
      
      // Format transaction type
      const txnType = data.type === "IMPREST" ? "IMP" : "EXP";      // Find the last transaction with similar prefix to get the sequence number
      const prefix = `${seriesData.prefix}-${firstName}-${roleAbbr}-${txnType}-`;
      
      // Get all transactions 
      const allTransactions = await db.transaction.findMany({
        orderBy: {
          id: 'desc'
        }
      });
      
      // Filter transactions that match our pattern
      const matchingTransactions = allTransactions.filter(t => 
        t.id.startsWith(prefix)
      );
      
      // Get the next sequence number
      let sequenceNumber = 1;
      if (matchingTransactions.length > 0) {
        // Extract the sequence number from the last transaction ID
        const lastIdParts = matchingTransactions[0].id.split('-');
        const lastSequence = parseInt(lastIdParts[lastIdParts.length - 1], 10);
        sequenceNumber = lastSequence + 1;
      }
      
      // Format sequence number with leading zeros
      const formattedSequence = String(sequenceNumber).padStart(3, '0');
      
      // Assemble transaction ID
      const transactionId = `${seriesData.prefix}-${firstName}-${roleAbbr}-${txnType}-${formattedSequence}`;
        // Create transaction with the generated ID
      console.log(`Creating transaction with ID: ${transactionId}`);
      const transaction = await db.transaction.create({
        data: {
          ...data,
          id: transactionId,
        },
      });
      
      console.log(`Transaction created successfully: ${transaction.id}`);
      return c.json({ success: true, transaction }, 201);
    } catch (error) {
      console.error("Transaction creation error:", error);
      return c.json({ error: error instanceof Error ? error.message : "Failed to create transaction" }, 500);
    }
  })

  // PATCH update transaction
  .patch("/:id", zValidator("json", TransactionUpdateSchema), async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const existing = await db.transaction.findUnique({ where: { id } });
      if (!existing) return c.json({ error: "Transaction not found" }, 404);

      const updated = await db.transaction.update({ where: { id }, data });
      return c.json({ success: true, transaction: updated });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to update transaction" }, 500);
    }
  })

  // DELETE transaction
  .delete("/:id", async (c) => {
    try {
      const id = c.req.param("id");

      const existing = await db.transaction.findUnique({ where: { id } });
      if (!existing) return c.json({ error: "Transaction not found" }, 404);

      await db.transaction.delete({ where: { id } });
      return c.json({ success: true, message: "Transaction deleted" });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to delete transaction" }, 500);
    }
  });

export default app;
