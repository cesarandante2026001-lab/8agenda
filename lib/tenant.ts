import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function getTenantSlug(): Promise<string | null> {
  const h = await headers()
  return h.get("x-tenant-slug")
}

export async function getTenantActual() {
  const slug = await getTenantSlug()
  if (!slug) return null
  return prisma.tenant.findUnique({ where: { slug } })
}