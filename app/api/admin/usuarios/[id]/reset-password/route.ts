import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { getUsuario, withTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

function generarPassword() {
  const alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let pwd = ""
  const bytes = randomBytes(10)
  for (let i = 0; i < 10; i++) pwd += alfabeto[bytes[i] % alfabeto.length]
  return pwd
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  // Verificar que el usuario pertenezca al tenant
  const user = await prisma.user.findFirst({
    where: { id, ...withTenant(u) },
  })
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const passwordPlano = generarPassword()
  const hash = await bcrypt.hash(passwordPlano, 10)

  await prisma.user.update({
    where: { id },
    data: { password: hash },
  })

  return NextResponse.json({
    ok: true,
    credenciales: { email: user.email, password: passwordPlano },
  })
}