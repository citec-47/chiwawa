# Dog Breeder Sales Website

## Goal

Build a responsive website for the two breeds represented in the existing `cHIWA/` and `Pomerianian/` image folders. Customers can browse dogs and submit inquiries. Administrators can sign in and manage breeds, dog listings, and inquiries.

## Approved requirements

- Public breed and dog listings, with prices and inquiry calls to action.
- Start with Chihuahua and Pomeranian breeds and use only supplied pet photos that have no visible logo or watermark.
- Use moderate, editable USD starter prices: $850 for a Chihuahua and $1,100 for a Pomeranian.
- Provide customer inquiry submission; do not implement payment or checkout.
- Provide a protected admin area to create, read, update, and delete breeds, dogs, and inquiries, including pet image uploads.
- Use placeholders for public breeder contact details until the owner supplies them.
- Do not claim unprovided animal details such as age, health, or availability. Make listing details editable and identify starter listings as needing owner review before publication.

## Architecture

- Next.js App Router with TypeScript for the public site, admin interface, and API routes.
- Neon-hosted PostgreSQL for breeds, dogs, inquiries, and administrator/session data.
- Cloudinary for pet image storage. Generate signed upload parameters on the server; never expose the Cloudinary API secret in browser code.
- Protect admin routes and mutations with secure authentication and HTTP-only session cookies. Public visitors can browse and submit inquiries without signing in.
- Keep all credentials and deployment-specific values in environment variables; provide a checked-in `.env.example` containing placeholders only. Do not use the credentials pasted in chat; rotate them before configuring the deployment.

## Data and behavior

- Breed: name, description, image, and timestamps.
- Dog: name, breed, description, price, image, publication status, and timestamps.
- Inquiry: customer name, email, phone (optional), message, dog reference (optional), status, and timestamps.
- Validate and sanitize input server-side. Restrict destructive and upload operations to authenticated administrators.
- Seed the two breed records and moderate starter dog listings from reviewed, unwatermarked supplied images. Keep any unverified details clearly marked for owner review.

## Acceptance criteria

- Public pages work on mobile and desktop, show the two breeds and published listings, and let visitors submit an inquiry.
- An administrator can sign in, manage breeds/dogs/inquiries, and upload images without exposing provider secrets.
- Data persists in PostgreSQL; validation and useful error states are present.
- The project includes setup instructions and environment-variable documentation, with no live credentials committed.
- Run the available build, type-check, and focused tests after implementation.
