import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function getSessionUser() {
  const session = await auth()
  return session?.user as { id?: string, role?: string, tenantId?: string } | undefined
}

export async function GET() {
  const u = await getSessionUser()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  // Si es superadmin, ve todas. Si es admin, solo la suya.
  const tenants = await prisma.tenant.findMany({
    where: u.role === "SUPERADMIN" ? {} : { id: u.tenantId },
    orderBy: { name: "asc" }
  })
  return NextResponse.json({ tenants })
}

export async function POST(req: Request) {
  const u = await getSessionUser()
  if (u?.role !== "SUPERADMIN") return NextResponse.json({ error: "Solo el Superadmin puede crear negocioes" }, { status: 403 })
  
  const count = await prisma.tenant.count()
  if (count >= 1) return NextResponse.json({ error: "El sistema solo permite una negocio." }, { status: 400 })
  
  const { name, slug, adminEmail, adminPassword } = await req.json()
  
  if (!name || !slug || !adminEmail || !adminPassword) {
    return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 })
  }

  try {
    const tenant = await prisma.tenant.create({
      data: { name, slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-') }
    })

    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrador de " + name,
        password: hashedPassword,
        role: "ADMIN",
        tenantId: tenant.id
      }
    })

    return NextResponse.json(tenant)
  } catch (error) {
    return NextResponse.json({ error: "El slug o el email ya existen." }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const u = await getSessionUser()
  if (u?.role !== "SUPERADMIN") return NextResponse.json({ error: "Solo el Superadmin puede eliminar negocioes" }, { status: 403 })
  
  const { id } = await req.json()
  try {
    await prisma.user.deleteMany({ where: { tenantId: id } })
    await prisma.tenant.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "No se puede eliminar: tiene datos asociados." }, { status: 400 })
  }
}