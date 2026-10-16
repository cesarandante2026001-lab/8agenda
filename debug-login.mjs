import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const email = "asistente.norte@8agenda.cl"
const password = "12345678"

const user = await prisma.user.findUnique({ where: { email } })
console.log("Usuario encontrado:", user ? "SI" : "NO")
if (user) {
  console.log("  id:", user.id)
  console.log("  email:", user.email)
  console.log("  role:", user.role)
  console.log("  tenantId:", user.tenantId)
  console.log("  tiene password?:", !!user.password)
  if (user.password) {
    const ok = await bcrypt.compare(password, user.password)
    console.log("  password coincide?:", ok)
  }
}

await prisma.$disconnect()