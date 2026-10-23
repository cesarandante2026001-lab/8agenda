import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { enviarCredencialesAlOwner } from "@/lib/emails"

const schema = z.object({
  tenantSlug: z.string().min(1).max(50),
})

function generarPassword() {
  const alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let pwd = ""
  const bytes = randomBytes(10)
  for (let i = 0; i < 10; i++) pwd += alfabeto[bytes[i] % alfabeto.length]
  return pwd
}

export async function POST(req: Request) {
  const secretEsperado = process.env.API_KEY_8QLICK
  const secretHeader = req.headers.get("x-api-key")

  if (!secretEsperado) {
    return NextResponse.json({ error: "Servidor sin API_KEY_8QLICK configurada" }, { status: 500 })
  }
  if (secretHeader !== secretEsperado) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { tenantSlug } = schema.parse(await req.json())

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        users: {
          where: { role: "OWNER" },
          take: 1,
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Negocio no encontrada" }, { status: 404 })
    }

    const owner = tenant.users[0]
    if (!owner) {
      return NextResponse.json({ error: "La negocio no tiene owner" }, { status: 400 })
    }

    const passwordPlano = generarPassword()
    const hash = await bcrypt.hash(passwordPlano, 10)

    await prisma.user.update({
      where: { id: owner.id },
      data: { password: hash },
    })

    enviarCredencialesAlOwner({
      to: owner.email,
      ownerNombre: owner.name || owner.email,
      negocio: tenant.name,
      slug: tenant.slug,
      password: passwordPlano,
    }).catch((e) => console.error("[reenviar] email fallo:", e))

    return NextResponse.json({
      ok: true,
      tenant: { slug: tenant.slug, name: tenant.name },
      owner: {
        email: owner.email,
        passwordTemporal: passwordPlano,
      },
    })
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ error: error.issues[0]?.message || "Datos invalidos" }, { status: 400 })
    }
    console.error("Error reenviar:", error)
    return NextResponse.json({ error: "Error al reenviar" }, { status: 500 })
  }
}