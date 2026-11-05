# Integration hand-off

- **Backend / frontend:** Next.js App Router at repository root; same-origin API routes. Dev `npm run dev` (port 3000); build `npm run build`; health `GET /api/health`; smoke-test `GET /`, `GET /api/public/catalog`, `GET /admin/login`.
- **Frontend seam:** `src/lib/catalog.ts` reads live public catalog data; `src/components/inquiry-form.tsx` posts visitor inquiries to `POST /api/inquiries`. No mock client or mock datasets are used.
- **Admin frontend:** `/admin/login`, `/admin`; client UI `src/components/admin-dashboard.tsx`.
- **API routes:** `GET /api/health`; `POST /api/inquiries`; `GET /api/public/catalog`; `POST /api/admin/login`; `POST /api/admin/logout`; `GET,POST /api/admin/breeds`; `PATCH,DELETE /api/admin/breeds/:id`; `GET,POST /api/admin/dogs`; `PATCH,DELETE /api/admin/dogs/:id`; `GET,POST /api/admin/inquiries`; `PATCH,DELETE /api/admin/inquiries/:id`; `POST /api/admin/cloudinary-signature`.
- **Database:** PostgreSQL / Neon; schema migration `drizzle/0000_initial.sql`; commands `npm run db:migrate`, `npm run db:seed`; connection `DATABASE_URL`; admin bootstrap `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`; Cloudinary `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- **Seed / migrations:** Chihuahua and Pomeranian, editable draft dog listings priced $850 and $1,100 USD. Review details before publishing. Database migrations create schema only; no inquiry/customer seed data.
- **Services:** Essential — Next.js website/API, PostgreSQL, admin authentication. Enhancement — Cloudinary signed uploads (local reviewed pet photos are available without it).
