import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/auth-helpers"
import { currentUser } from "@/lib/auth-helpers-extra"
import { AdminBackButton } from "@/components/AdminBackButton"
import { BotonCerrarSesion } from "@/components/BotonCerrarSesion"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ok = await isAdmin()
  if (!ok) redirect("/login?callbackUrl=/admin")

  const u = await currentUser()
  const user = u ? await prisma.user.findUnique({
    where: { id: u.id },
    include: { tenant: { select: { name: true, slug: true } } },
  }) : null

  const nombre = user?.name || u?.email || ""
  const rol = user?.role || ""
  const negocio = user?.tenant?.name || "Sin negocio"

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
            <div className="text-xs text-right leading-tight border-l border-gray-200 pl-4">
              <p className="font-medium text-gray-800">{nombre}</p>
              <p className="text-gray-500">
                {rol} - {negocio}
              </p>
            </div>
            <BotonCerrarSesion />
          </div>
        </div>
      </header>
      <AdminBackButton />
      {children}
    </>
  )
}