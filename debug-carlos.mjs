import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const u = await prisma.user.findUnique({
  where: { email: "carlos@8agenda.cl" },
  include: { tenant: { select: { name: true, slug: true } } },
})
console.log("carlos@8agenda.cl:", u)

const especialista = await prisma.specialist.findFirst({
  where: { email: "carlos@8agenda.cl" },
})
console.log("Especialista con ese email:", especialista)

await prisma.$disconnect()