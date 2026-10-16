import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Eliminar las especialidades creadas por el script demo en Clinica Norte
const tenant = await prisma.tenant.findUnique({ where: { slug: "clinica-norte" } })
if (tenant) {
  const borradas = await prisma.specialty.deleteMany({
    where: { tenantId: tenant.id },
  })
  console.log(`Borradas ${borradas.count} especialidades de Clinica Norte`)
}

await prisma.$disconnect()