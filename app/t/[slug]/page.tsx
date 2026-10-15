import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      specialties: {
        where: { active: true },
        orderBy: { order: "asc" },
      },
    },
  })

  if (!tenant) notFound()

  const color = tenant.primaryColor || "#000000"

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200" style={{ borderTopColor: color, borderTopWidth: 4 }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            {tenant.name}
          </h1>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/reservar" className="text-gray-700 hover:text-black">
              Reservar hora
            </Link>
            <Link href="/login" className="text-gray-700 hover:text-black">
              Ingresar
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <p className="text-xs tracking-[0.3em] text-gray-500 mb-6 uppercase">
          Agenda tu consulta
        </p>
        <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight leading-tight">
          Reserva tu hora
          <br />
          <span className="font-semibold">en 30 segundos</span>
        </h1>
        {tenant.address && (
          <p className="text-sm text-gray-500 mb-6">
            {tenant.address}{tenant.city ? `, ${tenant.city}` : ""}
          </p>
        )}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/reservar"
            className="text-white px-10 py-5 text-xs tracking-widest uppercase font-medium transition"
            style={{ backgroundColor: color }}
          >
            Reservar hora
          </Link>
        </div>
      </section>

      {tenant.specialties.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 pb-24">
          <p className="text-xs tracking-[0.3em] text-gray-500 mb-6 text-center uppercase">
            Especialidades disponibles
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tenant.specialties.map((e) => (
              <Link
                key={e.id}
                href="/reservar"
                className="border border-gray-200 rounded-lg p-6 text-center hover:border-black transition"
                style={{ borderTopColor: e.color || color, borderTopWidth: 3 }}
              >
                <p className="text-sm font-medium">{e.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-gray-200 py-8 text-center text-xs text-gray-400">
        {tenant.email && <p>{tenant.email}</p>}
        {tenant.phone && <p>{tenant.phone}</p>}
        <p className="mt-2">Powered by 8Agenda</p>
      </footer>
    </main>
  )
}