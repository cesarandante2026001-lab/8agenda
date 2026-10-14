import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">8Agenda</h1>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/login" className="text-gray-700 hover:text-black">
              Ingresar
            </Link>
            <Link
              href="/register"
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <p className="text-xs tracking-[0.3em] text-gray-500 mb-6 uppercase">
          Sistema de agendamiento
        </p>
        <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight leading-tight">
          Agenda horas medicas
          <br />
          <span className="font-semibold">sin complicaciones</span>
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          Sistema profesional para clinicas, consultas, peluquerias, barberias
          y cualquier negocio que necesite gestionar horas.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/login"
            className="bg-black text-white px-8 py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition"
          >
            Ingresar
          </Link>
          <Link
            href="/register"
            className="border border-gray-300 px-8 py-4 text-xs tracking-widest uppercase font-medium hover:border-black transition"
          >
            Crear cuenta
          </Link>
        </div>
      </section>
    </main>
  )
}