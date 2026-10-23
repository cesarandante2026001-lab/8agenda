import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { enviarCredencialesAlOwner } from "@/lib/emails"

const schema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Solo minusculas, numeros y guiones"),
  name: z.string().min(2).max(200).trim(),
  plan: z.enum(["FREE", "STARTER", "PRO", "BUSINESS", "ENTERPRISE"]).default("STARTER"),
  ownerEmail: z.string().email().toLowerCase().trim(),
  ownerName: z.string().min(2).max(100).trim(),
  ownerPhone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#000000"),
})

function generarPassword() {
  const alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let pwd = ""
  const bytes = randomBytes(10)
  for (let i = 0; i < 10; i++) {
    pwd += alfabeto[bytes[i] % alfabeto.length]
  }
  return pwd
}

export async function POST(req: Request) {
  // Autenticacion por secreto compartido con 8qlick
  const secretEsperado = process.env.API_KEY_8QLICK
  const secretHeader = req.headers.get("x-api-key")

  if (!secretEsperado) {
    return NextResponse.json({ error: "Servidor sin API_KEY_8QLICK configurada" }, { status: 500 })
  }

  if (secretHeader !== secretEsperado) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = schema.parse(await req.json())

    // Verificar que el slug y el email no existan
    const tenantExistente = await prisma.tenant.findUnique({ where: { slug: body.slug } })
    if (tenantExistente) {
      return NextResponse.json({ error: "Ya existe una negocio con ese slug" }, { status: 400 })
    }

    const userExistente = await prisma.user.findUnique({ where: { email: body.ownerEmail } })
    if (userExistente) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 400 })
    }

    const passwordPlano = generarPassword()
    const passwordHash = await bcrypt.hash(passwordPlano, 10)

    const resultado = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug: body.slug,
          name: body.name,
          plan: body.plan,
          status: "ACTIVE",
          primaryColor: body.primaryColor,
          email: body.email || null,
          phone: body.phone || null,
          address: body.address || null,
          city: body.city || null,
        },
      })

      const owner = await tx.user.create({
        data: {
          email: body.ownerEmail,
          password: passwordHash,
          name: body.ownerName,
          phone: body.ownerPhone || null,
          role: "OWNER",
          tenantId: tenant.id,
        },
      })

      await tx.tenant.update({
        where: { id: tenant.id },
        data: { ownerId: owner.id },
      })

      return { tenant, owner }
    })

    // Enviar credenciales al owner (no bloquea si falla)
    enviarCredencialesAlOwner({
      to: body.ownerEmail,
      ownerNombre: body.ownerName,
      negocio: body.name,
      slug: body.slug,
      password: passwordPlano,
    }).catch((e) => console.error("[crear-tenant] email fallo:", e))

    return NextResponse.json(
      {
        ok: true,
        tenant: {
          id: resultado.tenant.id,
          slug: resultado.tenant.slug,
          name: resultado.tenant.name,
          plan: resultado.tenant.plan,
          url: `${process.env.APP_URL || "http://localhost:3000"}/t/${resultado.tenant.slug}`,
        },
        owner: {
          id: resultado.owner.id,
          email: resultado.owner.email,
          passwordTemporal: passwordPlano,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ error: error.issues[0]?.message || "Datos invalidos" }, { status: 400 })
    }
    console.error("Error crear tenant:", error)
    return NextResponse.json({ error: "Error al crear la negocio" }, { status: 500 })
  }
}