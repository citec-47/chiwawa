import test from "node:test";
import assert from "node:assert/strict";
import { breedSchema, dogSchema, inquirySchema, inquiryUpdateSchema } from "./validation";

test("breed input trims and strips markup from editable copy", () => {
  const parsed = breedSchema.safeParse({
    name: " Chihuahua ",
    slug: "chihuahua",
    description: "  <b>Meet the breed</b>  ",
    imageUrl: "/images/chihuahua.jpg"
  });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.description, "Meet the breed");
});

test("image URLs are limited to local paths and Cloudinary assets", () => {
  const base = { name: "Test", slug: "test", description: "", imageUrl: "https://example.com/image.jpg" };
  assert.equal(breedSchema.safeParse(base).success, false);
  assert.equal(breedSchema.safeParse({ ...base, imageUrl: "https://res.cloudinary.com/demo/image/upload/dog.jpg" }).success, true);
});

test("dog input rejects unsupported publication states and invalid prices", () => {
  const base = {
    name: "Draft listing", breedId: "2a846c34-f570-4eb6-9ec0-c0b4f6704a9e", description: "",
    priceCents: 85000, imageUrl: "/images/chihuahua-listing.jpg", status: "draft"
  };
  assert.equal(dogSchema.safeParse(base).success, true);
  assert.equal(dogSchema.safeParse({ ...base, priceCents: 55000 }).success, true);
  assert.equal(dogSchema.safeParse({ ...base, priceCents: 110000 }).success, true);
  assert.equal(dogSchema.safeParse({ ...base, priceCents: 54999 }).success, false);
  assert.equal(dogSchema.safeParse({ ...base, priceCents: 110001 }).success, false);
  assert.equal(dogSchema.safeParse({ ...base, status: "available" }).success, false);
});

test("public inquiries validate email and require a meaningful message", () => {
  const base = { customerName: "Visitor", email: "hello@example.com", phone: "", message: "I would like to learn more." };
  const parsed = inquirySchema.safeParse(base);
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.phone, null);
  assert.equal(inquirySchema.safeParse({ ...base, email: "not-an-email" }).success, false);
  assert.equal(inquirySchema.safeParse({ ...base, message: "hi" }).success, false);
  const dogId = "2a846c34-f570-4eb6-9ec0-c0b4f6704a9e";
  assert.equal(inquirySchema.safeParse({ ...base, dogIds: [dogId] }).success, true);
  assert.equal(inquirySchema.safeParse({ ...base, dogIds: [dogId, dogId] }).success, false);
  assert.equal(inquirySchema.safeParse({ ...base, dogIds: [dogId, dogId, dogId, dogId] }).success, false);
});

test("inquiry updates accept editable fields or status but reject empty updates", () => {
  assert.equal(inquiryUpdateSchema.safeParse({ customerName: "Updated name" }).success, true);
  assert.equal(inquiryUpdateSchema.safeParse({ status: "closed" }).success, true);
  assert.equal(inquiryUpdateSchema.safeParse({ dogIds: ["2a846c34-f570-4eb6-9ec0-c0b4f6704a9e"] }).success, false);
  assert.equal(inquiryUpdateSchema.safeParse({}).success, false);
  assert.equal(inquiryUpdateSchema.safeParse({ status: "unknown" }).success, false);
});
