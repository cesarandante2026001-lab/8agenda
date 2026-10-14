import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import "dotenv/config"

const prisma = new PrismaClient()

async function main() {
  const email = "admin@8agenda.com"
  const password = "admin123456"

  const existe = await prisma.user.findUnique({ where: { email } })
  if (existe) {
    console.log("Ya existe el SUPERADMIN:", email)
    return
  }

  const hash = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      email,
      name: "Superadmin",
      password: hash,
      role: "SUPERADMIN",
    },
  })

  console.log("SUPERADMIN creado:")
  console.log("  Email:    " + email)
  console.log("  Password: " + password)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())