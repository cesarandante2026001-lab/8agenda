import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import type { UserRole } from "@prisma/client"

const ADMIN_ROLES: UserRole[] = ["SUPERADMIN", "OWNER", "ADMIN"]

function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role as UserRole)
}

function generarPassword(): string {
  return randomBytes(6).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const user = session.user as { role?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const especialistas = await prisma.specialist.findMany({
    include: { specialty: true, user: { select: { id: true, email: true } } },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ especialistas })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const user = session.user as { role?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  try {
    const body = await req.json()

    const email = body.email ? String(body.email).trim().toLowerCase() : null
    const name = String(body.name || "").trim()
    if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
    if (!email) return NextResponse.json({ error: "Email requerido para crear el usuario del doctor" }, { status: 400 })

    let tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { slug: "principal", name: "Institucion Principal" },
      })
    }

    // Verificar que el email no exista ya
    const existe = await prisma.user.findUnique({ where: { email } })
    if (existe) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 400 })
    }

    const passwordPlano = generarPassword()
    const passwordHash = await bcrypt.hash(passwordPlano, 10)

    const resultado = await prisma.$transaction(async (tx) => {
      const nuevoUser = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          name,
          role: "SPECIALIST",
          tenantId: tenant.id,
        },
      })

      const especialista = await tx.specialist.create({
        data: {
          tenantId: tenant.id,
          specialtyId: String(body.specialtyId),
          name,
          rut: body.rut ? String(body.rut).trim() : null,
          email,
          phone: body.phone ? String(body.phone).trim() : null,
          duracionConsulta: Number(body.duracionConsulta) || 20,
          anticipacionMinima: Number(body.anticipacionMinima) || 60,
          anticipacionMaxima: Number(body.anticipacionMaxima) || 60,
          userId: nuevoUser.id,
        },
        include: { specialty: true },
      })

      return { especialista, user: { id: nuevoUser.id, email: nuevoUser.email } }
    })

    return NextResponse.json(
      {
        especialista: resultado.especialista,
        credenciales: {
          email,
          password: passwordPlano,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error especialista:", error)
    return NextResponse.json({ error: "Error al crear" }, { status: 500 })
  }
}