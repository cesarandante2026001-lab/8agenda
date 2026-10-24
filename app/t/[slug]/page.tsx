import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function TenantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">{tenant.name}</h1>
      <p className="mt-4">Bienvenido a {tenant.name}.</p>
      <Link href="/login" className="mt-8 inline-block text-blue-600 underline">Acceso profesionales</Link>
    </main>
  )
}