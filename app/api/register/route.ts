import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { hash } from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, tenant } = body;

    const existe = await sql`SELECT * FROM "User" WHERE email = ${email}`;
    if (existe.length > 0) {
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
    }

    let tenantDb = await sql`SELECT * FROM "Tenant" WHERE name = ${tenant}`;
    if (tenantDb.length === 0) {
      const slug = tenant.toLowerCase().replace(/\s+/g, '-');
      tenantDb = await sql`
        INSERT INTO "Tenant" (id, name, slug, status, plan, theme, timezone, "createdAt", "updatedAt") 
        VALUES (gen_random_uuid()::text, ${tenant}, ${slug}, 'ACTIVE', 'BASIC', '{}'::jsonb, 'America/Santiago', NOW(), NOW()) 
        RETURNING *
      `;
    }

    const tenantId = tenantDb[0].id;
    const hashedPassword = await hash(password, 10);

    const nuevoUsuario = await sql`
      INSERT INTO "User" (id, email, name, password, role, "tenantId", "createdAt", "updatedAt") 
      VALUES (gen_random_uuid()::text, ${email}, ${tenant}, ${hashedPassword}, 'ADMIN', ${tenantId}, NOW(), NOW()) 
      RETURNING *
    `;

    return NextResponse.json({ success: true, user: nuevoUsuario[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear usuario' }, { status: 500 });
  }
}
