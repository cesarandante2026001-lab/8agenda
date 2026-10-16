import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { z } from "zod"
import { getUsuario, withTenant, esSuperadmin } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  name: z.string().min(2).max(100).trim(),
  rut: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email().toLowerCase().trim(),
  phone: z.string().max(30).optional().or(z.literal("")),
  specialtyId: z.string(),
  duracionConsulta: z.number().int().min(5).max(240).optional().default(20),
  anticipacionMinima: z.number().int().optional().default(60),
  anticipacionMaxima: z.number().int().optional().default(60),
})

function generarPassword() {
  const alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let pwd = ""
  const bytes = randomBytes(10)
  for (let i = 0; i < 10; i++) pwd += alfabeto[bytes[i] % alfabeto.length]
  return pwd
}

export async function GET() {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const especialistas = await prisma.specialist.findMany({
    where: { ...withTenant(u) },
    include: { specialty: true, user: { select: { id: true, email: true } } },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ especialistas })
}

export async function POST(req: Request) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  if (!u.tenantId && !esSuperadmin(u)) {
    return NextResponse.json({ error: "Usuario sin institucion" }, { status: 400 })
  }
  if (!u.tenantId) {
    return NextResponse.json({ error: "Superadmin debe especificar institucion" }, { status: 400 })
  }

  const body = schema.parse(await req.json())

  const esp = await prisma.specialty.findFirst({
    where: { id: body.specialtyId, tenantId: u.tenantId },
  })
  if (!esp) return NextResponse.json({ error: "Especialidad no valida" }, { status: 400 })

  const userExiste = await prisma.user.findUnique({ where: { email: body.email } })
  if (userExiste) {
    return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 400 })
  }

  const passwordPlano = generarPassword()
  const hash = await bcrypt.hash(passwordPlano, 10)

  const resultado = await prisma.$transaction(async (tx) => {
    const nuevoUser = await tx.user.create({
      data: {
        email: body.email,
        password: hash,
        name: body.name,
        role: "SPECIALIST",
        tenantId: u.tenantId,
      },
    })

    const especialista = await tx.specialist.create({
      data: {
        tenantId: u.tenantId!,
        specialtyId: body.specialtyId,
        name: body.name,
        rut: body.rut || null,
        email: body.email,
        phone: body.phone || null,
        duracionConsulta: body.duracionConsulta,
        anticipacionMinima: body.anticipacionMinima,
        anticipacionMaxima: body.anticipacionMaxima,
        userId: nuevoUser.id,
      },
      include: { specialty: true },
    })

    return { especialista, user: { id: nuevoUser.id, email: nuevoUser.email } }
  })

  return NextResponse.json(
    {
      especialista: resultado.especialista,
      credenciales: { email: body.email, password: passwordPlano },
    },
    { status: 201 }
  )
}