import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!process.env.DATABASE_URL) redirect("/admin/login?setup=required");
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login?setup=required");
  return <AdminDashboard email={admin.email} />;
}
