import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const BASE_DOMAINS = ["localhost", "8agenda.cl", "8agenda.vercel.app"]
const IGNORAR_SUBDOMINIOS = ["www", "app", "admin", "api"]

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || ""
  const hostSinPuerto = host.split(":")[0]
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

  if (tenantSlug) {
    // Reescribe / a /t/[slug] e inyecta x-tenant-slug en los headers
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-tenant-slug", tenantSlug)

    if (req.nextUrl.pathname === "/") {
      const url = req.nextUrl.clone()
      url.pathname = `/t/${tenantSlug}`
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    }

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
}