import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"

const ADMIN_ROLES: UserRole[] = ["SUPERADMIN", "OWNER", "ADMIN"]

function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role as UserRole)
}

function generarPassword(): string {
  const alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let pwd = ""
  const bytes = randomBytes(10)
  for (let i = 0; i < 10; i++) {
    pwd += alfabeto[bytes[i] % alfabeto.length]
  }
  return pwd
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const u = session.user as { role?: string }
  if (!isAdminRole(u.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  const passwordPlano = generarPassword()
  const hash = await bcrypt.hash(passwordPlano, 10)

  await prisma.user.update({
    where: { id },
    data: { password: hash },
  })

  return NextResponse.json({
    ok: true,
    credenciales: {
      email: user.email,
      password: passwordPlano,
    },
  })
}