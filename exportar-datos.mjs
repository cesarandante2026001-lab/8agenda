import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { writeFileSync } from "fs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const dump = {
  tenants: await prisma.tenant.findMany(),
  users: await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, tenantId: true } }),
  specialties: await prisma.specialty.findMany(),
  specialists: await prisma.specialist.findMany(),
  patients: await prisma.patient.findMany(),
  appointments: await prisma.appointment.findMany(),
  atenciones: await prisma.atencion.findMany(),
}

writeFileSync("backup-datos.json", JSON.stringify(dump, null, 2))
console.log("Datos exportados a backup-datos.json")
await prisma.$disconnect()