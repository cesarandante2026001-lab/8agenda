import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const u = await prisma.user.findUnique({
  where: { email: "asistente.norte@8agenda.cl" },
  select: { id: true, email: true, role: true, tenantId: true },
})
console.log("Usuario asistente.norte:", u)

if (u?.tenantId) {
  const esp = await prisma.specialty.findMany({
    where: { tenantId: u.tenantId },
    select: { id: true, name: true, tenantId: true },
  })
  console.log("Especialidades de ese tenant:", esp.length)
  console.log(esp)

  const todasEsp = await prisma.specialty.findMany({
    select: { id: true, name: true, tenantId: true },
  })
  console.log("TOTAL especialidades en la BD:", todasEsp.length)
  console.log(todasEsp)
}

await prisma.$disconnect()