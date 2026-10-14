import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = "cesar@8doce.cl"

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log("No existe el usuario:", email)
    console.log("Registrate primero con ese email en /register")
    return
  }

  await prisma.user.update({
    where: { email },
    data: { role: "SUPERADMIN" },
  })

  console.log("OK: " + email + " ahora es SUPERADMIN")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())