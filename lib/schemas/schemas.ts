// lib/schemas.ts
import { z } from "zod";

export const createSiteSchema = z.object({
  name: z.string().min(1, "Name is required").max(32, "Maximum 32 characters"),
  subdomain: z
    .string()
    .min(3, "Minimum 3 characters")
    .max(32, "Maximum 32 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens (no spaces)"),
  openapi: z.string().min(1, "You must paste a valid JSON"),
  password: z.string().min(1).optional(),
  brandColor: z.string().optional(),
  brandBackground: z.string().optional(),
  brandCard: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

// Exportamos el tipo para usarlo en el frontend
export type CreateSiteValues = z.infer<typeof createSiteSchema>;