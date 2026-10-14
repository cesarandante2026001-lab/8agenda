import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/auth-helpers"
import { AdminBackButton } from "@/components/AdminBackButton"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ok = await isAdmin()
  if (!ok) redirect("/login?callbackUrl=/admin")

  return (
    <>
      <AdminBackButton />
      {children}
    </>
  )
}