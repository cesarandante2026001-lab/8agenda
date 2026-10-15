import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { currentUser } from "@/lib/auth-helpers-extra"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  passwordActual: z.string().min(1),
  passwordNueva: z.string().min(6).max(100),
})

export async function POST(req: Request) {
  const u = await currentUser()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { passwordActual, passwordNueva } = schema.parse(body)

  const user = await prisma.user.findUnique({ where: { id: u.id } })
  if (!user || !user.password) {
    return NextResponse.json({ error: "Usuario sin contrasena configurada" }, { status: 400 })
  }

  const ok = await bcrypt.compare(passwordActual, user.password)
  if (!ok) {
    return NextResponse.json({ error: "Contrasena actual incorrecta" }, { status: 400 })
  }

  const hash = await bcrypt.hash(passwordNueva, 10)
  await prisma.user.update({
    where: { id: u.id },
    data: { password: hash },
  })

  return NextResponse.json({ ok: true })
}