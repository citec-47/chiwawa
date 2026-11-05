import { getCurrentAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin-login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const admin = process.env.DATABASE_URL ? await getCurrentAdmin() : null;
  if (admin) redirect("/admin");
  return <LoginForm />;
}
