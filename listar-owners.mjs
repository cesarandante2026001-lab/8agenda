import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const users = await prisma.user.findMany({
  where: { role: "OWNER" },
  select: { email: true, name: true, tenantId: true, createdAt: true },
  orderBy: { createdAt: "desc" },
})

console.log(JSON.stringify(users, null, 2))
await prisma.$disconnect()