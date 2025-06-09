import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { verifyAuth } from "@hono/auth-js";

import db from "@/lib/prisma";

// Validation schema for series creation
const SeriesSchema = z.object({
  prefix: z.string()
    .min(2, "Prefix must be at least 2 characters")
    .regex(/^[A-Z0-9-]+$/, "Prefix must contain only uppercase letters, numbers, and hyphens"),
  description: z.string().min(5, "Description must be at least 5 characters").optional(),
  isDefault: z.boolean().optional(),
});

// Validation schema for updating series
const SeriesUpdateSchema = z.object({
  prefix: z.string().optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const app = new Hono()
  .get("/", async (c) => {
    try {
      const allSeries = await db.senderIdSeries.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      return c.json({ success: true, series: allSeries });
    } catch (error) {
      console.error('Error fetching series:', error);
      const message = error instanceof Error ? error.message : "Failed to fetch series";
      return c.json({ error: message }, 500);
    }
  })  .post(
    "/",
    zValidator("json", SeriesSchema),
    async (c) => {
      try {
        const { prefix, description } = c.req.valid("json");
        
        // Check if a series with this prefix already exists
        const existingSeries = await db.senderIdSeries.findUnique({
          where: { prefix },
        });
        
        if (existingSeries) {
          return c.json({ error: 'A series with this prefix already exists' }, 409);
        }
        
        // Check if any series exists to determine isDefault
        const seriesCount = await db.senderIdSeries.count();
          // Create new series in the database
        const newSeries = await db.senderIdSeries.create({
          data: {
            prefix,
            description: description || "",
            isDefault: seriesCount === 0, // First series is default
            lastNumber: 0,
          },
        });
        
        // Add audit log - implement this later or integrate with your audit system
        // await createAuditLog('create', 'sender_id_series', newSeries.id);
        
        return c.json({ success: true, series: newSeries }, 201);
      } catch (error) {
        console.error('Error creating series:', error);
        const message = error instanceof Error ? error.message : "Failed to create series";
        return c.json({ error: message }, 500);
      }
    }
  )  .patch(
    "/:id",
    zValidator("json", SeriesUpdateSchema),
    async (c) => {
      try {
        const id = c.req.param("id");
        const data = c.req.valid("json");
          // Check if the series exists
        const series = await db.senderIdSeries.findUnique({
          where: { id },
        });
        
        if (!series) {
          return c.json({ error: 'Series not found' }, 404);
        }
        
        // Begin transaction
        await db.$transaction([
          // Remove default flag from all series
          db.senderIdSeries.updateMany({
            data: {
              isDefault: false,
            },
          }),
          
          // Set the specified series as default
          db.senderIdSeries.update({
            where: {
              id,
            },
            data: {
              isDefault: true,
            },
          })
        ]);
        
        // Add audit log - implement this later or integrate with your audit system
        // await createAuditLog('update', 'sender_id_series', seriesId);
        
        return c.json({ 
          success: true, 
          message: 'Default series updated successfully' 
        });
      } catch (error) {
        console.error('Error setting default series:', error);
        const message = error instanceof Error ? error.message : "Failed to set default series";
        return c.json({ error: message }, 500);
      }
    }
  )  .delete(
    "/:id",
    async (c) => {
      try {
        const id = c.req.param('id');
        
        if (!id) {
          return c.json({ error: 'Series ID is required' }, 400);
        }
        
        // Check if this is the default series
        const series = await db.senderIdSeries.findUnique({
          where: { id },
        });
        
        if (!series) {
          return c.json({ error: 'Series not found' }, 404);
        }
        
        if (series.isDefault) {
          return c.json({ error: 'Cannot delete the default series' }, 400);
        }
        
        // Delete the series
        await db.senderIdSeries.delete({
          where: { id },
        });
        
        // Add audit log - implement this later or integrate with your audit system
        // await createAuditLog('delete', 'sender_id_series', id);
        
        return c.json({ 
          success: true, 
          message: 'Series deleted successfully' 
        });
      } catch (error) {
        console.error('Error deleting series:', error);
        const message = error instanceof Error ? error.message : "Failed to delete series";
        return c.json({ error: message }, 500);
      }
    }
  );
  
export default app;
