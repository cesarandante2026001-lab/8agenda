import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Dominios base que NO son tenants (raiz, www, admin, etc.)
const BASE_DOMAINS = ["localhost", "8agenda.cl", "8agenda.vercel.app"]
const IGNORAR_SUBDOMINIOS = ["www", "app", "admin", "api"]

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || ""
  const hostSinPuerto = host.split(":")[0]

  // Ej: "clinica1.localhost" -> ["clinica1", "localhost"]
  // Ej: "clinica1.8agenda.cl" -> ["clinica1", "8agenda", "cl"]
  const partes = hostSinPuerto.split(".")

  let tenantSlug: string | null = null

  for (const base of BASE_DOMAINS) {
    const partesBase = base.split(".")
    if (partes.length === partesBase.length + 1) {
      const candidato = partes.slice(0, partes.length - partesBase.length).join(".")
      if (!IGNORAR_SUBDOMINIOS.includes(candidato)) {
        tenantSlug = candidato
      }
      break
    }
  }

  const res = NextResponse.next()

  if (tenantSlug) {
    res.headers.set("x-tenant-slug", tenantSlug)
    // Reescribe / a /t/[slug] para servir la home del tenant
    if (req.nextUrl.pathname === "/") {
      const url = req.nextUrl.clone()
      url.pathname = `/t/${tenantSlug}`
      return NextResponse.rewrite(url, {
        request: { headers: new Headers({ ...Object.fromEntries(req.headers), "x-tenant-slug": tenantSlug }) },
      })
    }
  }

  return res
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api|.*\\..*).*)"],
}