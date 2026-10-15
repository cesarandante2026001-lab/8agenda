import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { randomBytes } from "crypto"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// --- PASO 1: Borrar slots duplicados (mismo esp + fecha + hora) ---
console.log("Limpiando slots duplicados...\n")

const todos = await prisma.slot.findMany({
  orderBy: { createdAt: "asc" },
})

const vistos = new Set()
const duplicados = []

for (const s of todos) {
  const key = `${s.specialistId}|${s.date.toISOString()}|${s.startTime}`
  if (vistos.has(key)) {
    // solo borramos si no tiene cita asociada
    const cita = await prisma.appointment.findUnique({ where: { slotId: s.id } })
    if (!cita) duplicados.push(s.id)
  } else {
    vistos.add(key)
  }
}

if (duplicados.length > 0) {
  await prisma.slot.deleteMany({ where: { id: { in: duplicados } } })
  console.log(`Borrados ${duplicados.length} slots duplicados.\n`)
} else {
  console.log("Sin duplicados.\n")
}

// --- PASO 2: Crear 20 citas con slots UNICOS ---
const pacientes = [
  { nombre: "Maria Fernanda Gonzalez",  rut: "17845320-3", email: "mfg@gmail.com",           telefono: "+56912345678" },
  { nombre: "Pedro Antonio Ramirez",    rut: "12345678-5", email: "pedro.ramirez@gmail.com",  telefono: "+56923456789" },
  { nombre: "Javiera Ignacia Torres",   rut: "20123456-7", email: "javiera.torres@gmail.com", telefono: "+56934567890" },
  { nombre: "Luis Alberto Fernandez",   rut: "9876543-2",  email: "luis.fernandez@gmail.com", telefono: "+56945678901" },
  { nombre: "Catalina Sofia Munoz",     rut: "21456789-0", email: "cata.munoz@gmail.com",     telefono: "+56956789012" },
  { nombre: "Sebastian Andres Rojas",   rut: "18765432-1", email: "seba.rojas@gmail.com",     telefono: "+56967890123" },
  { nombre: "Constanza Paz Silva",      rut: "19876543-6", email: "connie.silva@gmail.com",   telefono: "+56978901234" },
  { nombre: "Diego Ignacio Castro",     rut: "16789012-4", email: "diego.castro@gmail.com",   telefono: "+56989012345" },
  { nombre: "Valentina Antonia Lopez",  rut: "22345678-9", email: "vale.lopez@gmail.com",     telefono: "+56990123456" },
  { nombre: "Matias Esteban Vargas",    rut: "14567890-2", email: "matias.vargas@gmail.com",  telefono: "+56901234567" },
  { nombre: "Antonia Belen Herrera",    rut: "20987654-8", email: "anto.herrera@gmail.com",   telefono: "+56912345098" },
  { nombre: "Cristobal Tomas Pena",     rut: "15678901-5", email: "cris.pena@gmail.com",      telefono: "+56923456097" },
  { nombre: "Florencia Isabel Soto",    rut: "21345678-2", email: "flor.soto@gmail.com",      telefono: "+56934567096" },
  { nombre: "Nicolas Patricio Rivas",   rut: "13456789-7", email: "nico.rivas@gmail.com",     telefono: "+56945678095" },
  { nombre: "Josefa Ignacia Contreras", rut: "22567890-4", email: "jose.contreras@gmail.com", telefono: "+56956789094" },
  { nombre: "Felipe Eduardo Morales",   rut: "11234567-3", email: "felipe.morales@gmail.com", telefono: "+56967890093" },
  { nombre: "Amanda Jesus Reyes",       rut: "19654321-9", email: "amanda.reyes@gmail.com",   telefono: "+56978901092" },
  { nombre: "Benjamin Alonso Nunez",    rut: "17456789-1", email: "benja.nunez@gmail.com",    telefono: "+56989012091" },
  { nombre: "Paz Emilia Caceres",       rut: "21789012-6", email: "paz.caceres@gmail.com",    telefono: "+56990123090" },
  { nombre: "Tomas Ignacio Fuentes",    rut: "16234567-8", email: "tomas.fuentes@gmail.com",  telefono: "+56901234089" },
]

const especialistas = await prisma.specialist.findMany({ where: { active: true } })
if (especialistas.length === 0) {
  console.log("No hay especialistas activos.")
  await prisma.$disconnect()
  process.exit(0)
}

const hoy = new Date()
const inicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()))
const fin = new Date(inicio.getTime() + 14 * 24 * 60 * 60 * 1000)

// Solo slots libres que NO tengan ya una cita (por las dudas)
const slots = await prisma.slot.findMany({
  where: {
    status: "LIBRE",
    date: { gte: inicio, lt: fin },
    appointment: null,
  },
  orderBy: [{ date: "asc" }, { startTime: "asc" }],
})

console.log(`Slots disponibles unicos: ${slots.length}\n`)

// --- PASO 3: Agrupar slots por (especialista, fecha, hora) para evitar duplicados ---
const usados = new Set()
const slotsUnicos = []
for (const s of slots) {
  const key = `${s.specialistId}|${s.date.toISOString()}|${s.startTime}`
  if (!usados.has(key)) {
    usados.add(key)
    slotsUnicos.push(s)
  }
}

console.log(`Slots unicos (sin repetir hora/especialista/dia): ${slotsUnicos.length}\n`)

const total = Math.min(20, slotsUnicos.length)
let creadas = 0

for (let i = 0; i < total; i++) {
  const persona = pacientes[i]
  const slot = slotsUnicos[i]

  const esp = await prisma.specialist.findUnique({ where: { id: slot.specialistId } })
  if (!esp) continue

  let paciente = await prisma.patient.findFirst({
    where: { tenantId: esp.tenantId, rut: persona.rut },
  })
  if (!paciente) {
    paciente = await prisma.patient.create({
      data: {
        tenantId: esp.tenantId,
        name: persona.nombre,
        rut: persona.rut,
        email: persona.email,
        phone: persona.telefono,
      },
    })
  }

  const cancelToken = randomBytes(16).toString("hex")
  const cancelTokenExpira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  try {
    await prisma.$transaction(async (tx) => {
      await tx.slot.update({
        where: { id: slot.id },
        data: { status: "TOMADO" },
      })
      await tx.appointment.create({
        data: {
          tenantId: esp.tenantId,
          specialistId: slot.specialistId,
          slotId: slot.id,
          patientId: paciente.id,
          status: "RESERVADA",
          patientName: persona.nombre,
          patientRut: persona.rut,
          patientEmail: persona.email,
          patientPhone: persona.telefono,
          cancelToken,
          cancelTokenExpira,
        },
      })
    })
    creadas++
    const fecha = slot.date.toISOString().slice(0, 10)
    console.log(`OK ${String(creadas).padStart(2)}. ${persona.nombre} -> ${esp.name} ${fecha} ${slot.startTime}`)
  } catch (e) {
    console.log(`SKIP ${persona.nombre}: slot ocupado (${e.code})`)
  }
}

console.log(`\nTotal creadas: ${creadas}`)
await prisma.$disconnect()