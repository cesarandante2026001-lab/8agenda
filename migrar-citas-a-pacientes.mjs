import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const citasSinPaciente = await prisma.appointment.findMany({
  where: { patientId: null },
})

console.log(`Citas sin paciente: ${citasSinPaciente.length}\n`)

for (const c of citasSinPaciente) {
  // Buscar si ya existe un Patient con ese rut o email en el mismo tenant
  let paciente = await prisma.patient.findFirst({
    where: {
      tenantId: c.tenantId,
      OR: [
        c.patientRut ? { rut: c.patientRut } : {},
        c.patientEmail ? { email: c.patientEmail } : {},
      ].filter((x) => Object.keys(x).length > 0),
    },
  })

  if (!paciente) {
    paciente = await prisma.patient.create({
      data: {
        tenantId: c.tenantId,
        name: c.patientName,
        rut: c.patientRut || null,
        email: c.patientEmail,
        phone: c.patientPhone,
      },
    })
    console.log(`CREADO: ${c.patientName} (${c.patientEmail})`)
  } else {
    console.log(`VINCULADO: ${c.patientName} -> paciente existente`)
  }

  await prisma.appointment.update({
    where: { id: c.id },
    data: { patientId: paciente.id },
  })
}

console.log("\nListo.")
await prisma.$disconnect()