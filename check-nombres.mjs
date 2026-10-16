import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const citas = await prisma.appointment.findMany({
  where: { patientId: { not: null } },
  include: { patient: true },
  orderBy: { createdAt: "desc" },
  take: 40,
})

console.log(`Total: ${citas.length}\n`)
console.log("patientName (cita) | patient.name (ficha) | coincide?")
console.log("-".repeat(80))

for (const c of citas) {
  const a = c.patientName.trim().toLowerCase()
  const b = c.patient?.name.trim().toLowerCase() || "(sin paciente)"
  const ok = a === b ? "OK" : "DISTINTO"
  console.log(`${c.patientName} | ${c.patient?.name || "-"} | ${ok}`)
}

await prisma.$disconnect()