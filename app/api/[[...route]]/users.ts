import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { verifyAuth } from "@hono/auth-js";

import db from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import sendEmail from "@/lib/email";

const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6).optional(), // Make password optional
  role: z.enum(["admin", "accountant", "employee"]),
  printName: z.string(),
  position: z.string(),
  phone: z.string(),
  whatsapp: z.string(),
  address: z.string(),
  senderId: z.string(),
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  permissions: z.array(z.string()),
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

const app = new Hono()

  // ✅ Get all users (admin only)
  .get("/users", async (c) => {
    try {
      const users = await db.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return c.json({ users });
    } catch (error) {
      console.log(error);
      return c.json({ error: "re" }, 500);
    }
  })

  // ✅ Create user with full form fields
  .post("/users", zValidator("json", createUserSchema), async (c) => {
    const {
      name,
      email,
      password,
      role,
      printName,
      position,
      phone,
      whatsapp,
      address,
      senderId,
      panNumber,
      aadhaarNumber,
      permissions,
    } = c.req.valid("json");    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      return c.json({ error: "Email already in use" }, 400);
    }    // Generate a secure password always
    const { generateSecurePassword } = await import("@/lib/utils");
    const securePassword = generateSecurePassword();
    
    // Store the generated password directly (no hashing)
    const user = await db.user.create({
      data: {
        name,
        email,
        password: securePassword, // Store plain-text generated password
        role,
        printName,
        position,
        phone,
        whatsapp,
        address,
        senderId: senderId + "-" + printName || null,
        panNumber,
        aadhaarNumber,
        permissions: {
          create: permissions.map((perm) => ({
            permission: {
              connect: { code: perm   },
            },
          })),
        },
      },
    });

    // Send email with the generated password (not the hashed one)
    await sendEmail(email, securePassword);    return c.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          printName: user.printName,
          senderId: user.senderId,
          position: user.position,
          phone: user.phone,
          whatsapp: user.whatsapp,
          address: user.address,
          panNumber: user.panNumber,
          aadhaarNumber: user.aadhaarNumber, // Include plain password in response
          // permissions: user.permissions,
        },
        generatedPassword: securePassword
      },
      201
    );
  })

  .get("/users/me", verifyAuth(), async (c) => {
    const userId = c.get("authUser")?.token?.id as string;

    const user = await db.user.findUnique({
      where: { id: userId },
     
    });

    return c.json({ user });
  })

  .patch(
    "/users",
    verifyAuth(),
    zValidator("json", updateUserSchema),
    async (c) => {
      const userId = c.get("authUser")?.token?.id as string;
      const { name, email, password } = c.req.valid("json");      const updatedData: any = {};
      if (name) updatedData.name = name;
      if (email) updatedData.email = email;
      if (password) {
        // Generate new password instead of hashing user input
        const { generateSecurePassword } = await import("@/lib/utils");
        updatedData.password = generateSecurePassword();
      }

      const updatedUser = await db.user.update({
        where: { id: userId },
        data: updatedData,
      });

      return c.json({ user: updatedUser });
    }
  )

  .delete("/users/:id", verifyAuth(), async (c) => {
    const auth = c.get("authUser");
    if (auth.token?.role !== "admin") {
      return c.json({ error: "Forbidden" }, 403);
    }

    const id = c.req.param("id");
    await db.user.delete({ where: { id } });

    return c.json({ message: "User deleted" });
  });

export default app;
