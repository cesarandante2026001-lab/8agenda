import Link from "next/link"

export default function AnuladoOkPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-light mb-3">
          Reserva <span className="font-semibold">anulada</span>
        </h1>
        <p className="text-gray-600 mb-8">
          Tu reserva fue anulada correctamente. El horario quedo libre.
        </p>
        <Link
          href="/reservar"
          className="inline-block bg-black text-white px-8 py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition"
        >
          Reservar otra hora
        </Link>
      </div>
    </main>
  )
}