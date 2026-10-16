import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const sp = await searchParams
  const vieneDePublico = sp.from === "publico"

  const session = await auth()

  if (session?.user && !vieneDePublico) {
    const role = (session.user as any).role
    if (["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST"].includes(role)) redirect("/admin")
    if (role === "SPECIALIST") redirect("/especialista")
  }

  const especialidades = await prisma.specialty.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  })

  const logueado = !!session?.user
  const rol = logueado ? (session!.user as any).role : null

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/?from=publico" className="text-2xl font-bold tracking-tight">
            8Agenda
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/reservar" className="text-gray-700 hover:text-black">
              Reservar hora
            </Link>
            {logueado && ["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST"].includes(rol) && (
              <Link href="/admin" className="text-gray-700 hover:text-black">
                Ir al panel
              </Link>
            )}
            {logueado && rol === "SPECIALIST" && (
              <Link href="/especialista" className="text-gray-700 hover:text-black">
                Ir a mi panel
              </Link>
            )}
            {!logueado && (
              <Link href="/login" className="text-gray-700 hover:text-black">
                Ingresar
              </Link>
            )}
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
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          Elige especialidad, especialista y hora. Confirmacion inmediata por email.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/reservar"
            className="bg-black text-white px-10 py-5 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition"
          >
            Reservar hora
          </Link>
          {!logueado && (
            <Link
              href="/login"
              className="border border-gray-300 px-10 py-5 text-xs tracking-widest uppercase font-medium hover:border-black transition"
            >
              Soy profesional
            </Link>
          )}
        </div>
      </section>

      {especialidades.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 pb-24">
          <p className="text-xs tracking-[0.3em] text-gray-500 mb-6 text-center uppercase">
            Especialidades disponibles
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {especialidades.map((e) => (
              <Link
                key={e.id}
                href="/reservar"
                className="border border-gray-200 rounded-lg p-6 text-center hover:border-black transition"
                style={{ borderTopColor: e.color || "#000000", borderTopWidth: 3 }}
              >
                <p className="text-sm font-medium">{e.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-gray-200 py-8 text-center text-xs text-gray-400">
        <p>Powered by 8Agenda</p>
      </footer>
    </main>
  )
}