"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function AdminBackButton() {
  const pathname = usePathname()

  // No mostrar en /admin (es la portada)
  if (pathname === "/admin" || pathname === "/admin/") return null

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-gray-500 hover:text-black transition"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver al panel
        </Link>
      </div>
    </div>
  )
}