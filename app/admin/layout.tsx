import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/auth-helpers"
import { AdminBackButton } from "@/components/AdminBackButton"
import { BotonCerrarSesion } from "@/components/BotonCerrarSesion"

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
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/admin" className="text-sm font-semibold tracking-tight">
            8Agenda admin
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xs uppercase tracking-widest text-gray-500 hover:text-black">
              Ver sitio publico
            </Link>
            <Link href="/cuenta/password" className="text-xs uppercase tracking-widest text-gray-500 hover:text-black">
              Cambiar contrasena
            </Link>
            <BotonCerrarSesion />
          </div>
        </div>
      </header>
      <AdminBackButton />
      {children}
    </>
  )
}