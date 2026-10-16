import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const correo = "cesarandante2026001@gmail.com"

const r = await prisma.patient.updateMany({
  data: { email: correo },
})

console.log(`Pacientes actualizados: ${r.count}`)

// Tambien actualizar los patientEmail de las citas para que el listado muestre el correo real
const r2 = await prisma.appointment.updateMany({
  data: { patientEmail: correo },
})
console.log(`Citas actualizadas: ${r2.count}`)

await prisma.$disconnect()