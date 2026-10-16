import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const email = "asistente.norte@8agenda.cl"
const password = "12345678"

console.log("--- PROBANDO LOGIN ---")

const user = await prisma.user.findUnique({ where: { email } })
if (!user) {
  console.log("ERROR 1: no existe el usuario")
  await prisma.$disconnect()
  process.exit(1)
}

console.log("Usuario OK")
console.log("  role:", user.role)
console.log("  tenantId:", user.tenantId)

if (!user.password) {
  console.log("ERROR 2: el usuario no tiene password guardada")
  await prisma.$disconnect()
  process.exit(1)
}

const ok = await bcrypt.compare(password, user.password)
if (!ok) {
  console.log("ERROR 3: la contrasena no coincide")
  await prisma.$disconnect()
  process.exit(1)
}

console.log("Contrasena OK")
console.log("")
console.log("TODO BIEN. El problema NO es el usuario.")
console.log("El problema esta en el navegador o en el server Next.js.")

await prisma.$disconnect()