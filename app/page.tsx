import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function HomePage() {
  const tenant = await prisma.tenant.findFirst()

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar simple */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">8Agenda</h1>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black">Acceso Profesionales</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Agenda tus horas <br />
          <span className="text-blue-600">en 30 segundos</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10">
          Elige especialidad, especialista y hora. Confirmacion inmediata por email. 
          Sistema de agendamiento para cualquier tipo de negocio.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          {tenant ? (
            <Link href={`/t/${tenant.slug}`} className="px-8 py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition">
              Reservar hora
            </Link>
          ) : (
            <span className="px-8 py-4 bg-gray-300 text-white rounded-lg font-semibold cursor-not-allowed">
              Sin negocioes configuradas
            </span>
          )}
          <Link href="/login" className="px-8 py-4 bg-white text-black border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition">
            Soy profesional
          </Link>
        </div>
      </section>

      {/* Caracteristicas rapidas */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-bold mb-1">Reserva Online</h3>
            <p className="text-sm text-gray-500">Tus clientes agendan solos, 24/7.</p>
          </div>
          <div>
            <div className="text-3xl mb-2">📧</div>
            <h3 className="font-bold mb-1">Confirmacion por Email</h3>
            <p className="text-sm text-gray-500">Notificaciones automaticas.</p>
          </div>
          <div>
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-bold mb-1">Multiples Especialistas</h3>
            <p className="text-sm text-gray-500">Cada uno con su propia agenda.</p>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>&copy; 2026 8Agenda. Todos los derechos reservados.</p>
      </footer>
    </main>
  )
}
