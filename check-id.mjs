import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const id = "cmv8oma200000sgtlo3cadgtf"

const app = await prisma.appointment.findUnique({
  where: { id },
  include: { specialist: true, slot: true, patient: true, atencion: true },
})

console.log("Appointment:", app)

const atencion = await prisma.atencion.findUnique({
  where: { appointmentId: id },
  include: { recetas: true, examenes: true },
})
console.log("Atencion:", atencion)

await prisma.$disconnect()