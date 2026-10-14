import Link from "next/link"
import { redirect } from "next/navigation"
import { currentUser } from "@/lib/auth-helpers-extra"

export const dynamic = "force-dynamic"

export default async function EspecialistaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const u = await currentUser()
  if (!u) redirect("/login?callbackUrl=/especialista")
  if (!["SPECIALIST", "SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST"].includes(u.role)) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/especialista" className="text-lg font-semibold tracking-tight">
            Panel especialista
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/especialista" className="text-gray-700 hover:text-black">
              Mis citas
            </Link>
            <Link href="/especialista/hoy" className="text-gray-700 hover:text-black">
              Hoy
            </Link>
            <Link href="/admin" className="text-gray-700 hover:text-black">
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}