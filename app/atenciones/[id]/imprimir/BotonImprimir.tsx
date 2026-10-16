"use client"

export default function BotonImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-black text-white px-5 py-3 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition"
    >
      Imprimir
    </button>
  )
}