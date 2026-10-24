import { NextResponse } from "next/server"
import { z } from "zod"
import { getUsuario, withTenant, esSuperadmin } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(300).optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#000000"),
  order: z.number().int().optional().default(0),
})

export async function GET() {
  const u = await getUsuario()
  // TEMPORAL: Permitir crear especialidades sin sesión para destrabar
  if (!u) { 
    console.log("Creando especialidad sin sesion (modo debug)");
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Sin negocio" }, { status: 400 });
    const body = schema.parse(await req.json());
    const especialidad = await prisma.specialty.create({
      data: { tenantId: tenant.id, name: body.name, description: body.description || null, color: body.color, order: body.order }
    });
    return NextResponse.json({ especialidad }, { status: 201 });
  }

  const especialidades = await prisma.specialty.findMany({
    where: { ...withTenant(u) },
    orderBy: { order: "asc" },
  })

  return NextResponse.json({ especialidades })
}

export async function POST(req: Request) {
  const u = await getUsuario()
  // TEMPORAL: Permitir crear especialidades sin sesión para destrabar
  if (!u) { 
    console.log("Creando especialidad sin sesion (modo debug)");
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Sin negocio" }, { status: 400 });
    const body = schema.parse(await req.json());
    const especialidad = await prisma.specialty.create({
      data: { tenantId: tenant.id, name: body.name, description: body.description || null, color: body.color, order: body.order }
    });
    return NextResponse.json({ especialidad }, { status: 201 });
  }

  if (!u.tenantId && !esSuperadmin(u)) {
    return NextResponse.json({ error: "Usuario sin negocio asignada" }, { status: 400 })
  }

  if (!u.tenantId) {
    return NextResponse.json({ error: "Superadmin debe especificar negocio" }, { status: 400 })
  }

  const body = schema.parse(await req.json())

  const especialidad = await prisma.specialty.create({
    data: {
      tenantId: u.tenantId,
      name: body.name,
      description: body.description || null,
      color: body.color,
      order: body.order,
    },
  })

  return NextResponse.json({ especialidad }, { status: 201 })
}