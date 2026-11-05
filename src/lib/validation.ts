import { z } from "zod";

const cleanText = (max: number, min = 0) =>
  z.string().trim().max(max)
    .transform((value) => value.replace(/<[^>]*>/g, "").trim())
    .pipe(z.string().min(min).max(max));
const imageUrl = z.string().trim().max(2000).refine(
  (value) => value === "" ||
    (value.startsWith("/") && !value.startsWith("//")) ||
    /^https:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/image\/upload\//.test(value),
  "Image must be a site path or a Cloudinary image URL."
);

export const breedSchema = z.object({
  name: cleanText(100, 1),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  description: cleanText(3000),
  imageUrl
});

export const dogSchema = z.object({
  name: cleanText(120, 1),
  breedId: z.string().uuid(),
  description: cleanText(3000),
  priceCents: z.number().int().min(0).max(100_000_000),
  imageUrl,
  status: z.enum(["draft", "published"])
});

export const inquirySchema = z.object({
  customerName: cleanText(120, 1),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().transform((value) => value || null),
  message: cleanText(3000, 10),
  dogId: z.string().uuid().optional().nullable()
});

export const inquiryUpdateSchema = inquirySchema.partial()
  .extend({ status: z.enum(["new", "in_progress", "closed"]).optional() })
  .refine((value) => Object.keys(value).length > 0, "Provide at least one inquiry field to update.");

export function validationMessage(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}
