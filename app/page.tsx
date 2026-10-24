import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const tenant = await prisma.tenant.findFirst({
    include: {
      specialties: { where: { active: true }, orderBy: { order: "asc" } }
    }
  })

  if (!tenant) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">8Agenda</h1>
          <p className="text-gray-500 mb-4">Sin negocio configurado.</p>
          <Link href="/login" className="inline-block text-blue-600 hover:underline">Acceso profesionales</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <nav className="flex gap-6 text-sm">
          <Link href="/reservar" className="hover:text-black">Reservar</Link>
          <Link href="/login" className="hover:text-black">Ingresar</Link>
        </nav>
      </header>
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-light mb-6">Reserva tu hora <br /><span className="font-semibold">en 30 segundos</span></h1>
        <Link href="/reservar" className="bg-black text-white px-8 py-4 rounded uppercase tracking-widest text-xs font-medium">
          Reservar hora
        </Link>
      </section>
      {tenant.specialties.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 pb-24">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-6 text-center">Especialidades</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tenant.specialties.map((e) => (
              <Link key={e.id} href="/reservar" className="border border-gray-200 rounded-lg p-6 text-center hover:border-black">
                <p className="text-sm font-medium">{e.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}