import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const citas = await prisma.appointment.findMany({
  where: { patientId: { not: null } },
  include: { patient: true },
})

let corregidas = 0
let creadas = 0

for (const c of citas) {
  if (!c.patient) continue

  const nombreCita = c.patientName.trim().toLowerCase()
  const nombrePaciente = c.patient.name.trim().toLowerCase()

  if (nombreCita === nombrePaciente) continue

  // Buscar Patient por RUT (unico por tenant) o por nombre exacto
  let pacienteCorrecto = null

  if (c.patientRut) {
    pacienteCorrecto = await prisma.patient.findFirst({
      where: { tenantId: c.tenantId, rut: c.patientRut },
    })
  }

  if (!pacienteCorrecto) {
    pacienteCorrecto = await prisma.patient.findFirst({
      where: { tenantId: c.tenantId, name: c.patientName },
    })
  }

  if (!pacienteCorrecto) {
    pacienteCorrecto = await prisma.patient.create({
      data: {
        tenantId: c.tenantId,
        name: c.patientName,
        rut: c.patientRut || null,
        email: c.patientEmail,
        phone: c.patientPhone,
      },
    })
    creadas++
    console.log(`+ Paciente CREADO: ${c.patientName} (RUT ${c.patientRut || "-"})`)
  }

  if (pacienteCorrecto.id !== c.patientId) {
    const atencion = await prisma.atencion.findUnique({
      where: { appointmentId: c.id },
    })

    const nuevoPatientId = pacienteCorrecto.id

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: c.id },
        data: { patientId: nuevoPatientId },
      })
      if (atencion) {
        await tx.atencion.update({
          where: { id: atencion.id },
          data: { patientId: nuevoPatientId },
        })
      }
    })

    corregidas++
    console.log(`OK Cita corregida: "${c.patientName}" (antes apuntaba a "${c.patient.name}")`)
  }
}

console.log(`\nTotal citas corregidas: ${corregidas}`)
console.log(`Total pacientes creados: ${creadas}`)

await prisma.$disconnect()