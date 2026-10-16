import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function IrPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as any).role
  if (["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST"].includes(role)) {
    redirect("/admin")
  }
  if (role === "SPECIALIST") {
    redirect("/especialista")
  }

  redirect("/")
}