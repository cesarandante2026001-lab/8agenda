import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(6),
  name: z.string().min(2).max(100).trim(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const existe = await prisma.user.findUnique({ where: { email: data.email } })
    if (existe) {
      return NextResponse.json(
        { error: "Ese email ya esta registrado" },
        { status: 400 }
      )
    }

    const hash = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hash,
        role: "PATIENT",
      },
    })

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Datos invalidos" },
        { status: 400 }
      )
    }
    console.error("Error registro:", error)
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 })
  }
}