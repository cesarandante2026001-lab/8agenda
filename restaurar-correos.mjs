import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const citas = await prisma.appointment.updateMany({
  where: { patientEmail: "cesarandante2026001@gmail.com" },
  data: { patientEmail: "ccousino@gmail.com" },
})
console.log("Citas actualizadas:", citas.count)

const esp = await prisma.specialist.updateMany({
  where: { email: "cesarandante2026001@gmail.com" },
  data: { email: "carcou2017@gmail.com" },
})
console.log("Especialistas actualizados:", esp.count)

await prisma.$disconnect()