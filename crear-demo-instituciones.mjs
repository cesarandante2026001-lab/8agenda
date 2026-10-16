import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const password = "12345678"
const hash = await bcrypt.hash(password, 10)

// ---------- Institucion 1: Clinica Norte ----------
let norte = await prisma.tenant.findUnique({ where: { slug: "clinica-norte" } })
if (!norte) {
  norte = await prisma.tenant.create({
    data: {
      slug: "clinica-norte",
      name: "Clinica Norte",
      primaryColor: "#2563eb",
      email: "contacto@clinicanorte.cl",
      phone: "+56223456789",
      address: "Av. Apoquindo 1234",
      city: "Santiago",
      plan: "STARTER",
      status: "ACTIVE",
    },
  })
}

// ---------- Institucion 2: Centro Medico Sur ----------
let sur = await prisma.tenant.findUnique({ where: { slug: "centro-medico-sur" } })
if (!sur) {
  sur = await prisma.tenant.create({
    data: {
      slug: "centro-medico-sur",
      name: "Centro Medico Sur",
      primaryColor: "#16a34a",
      email: "contacto@centrosur.cl",
      phone: "+56229876543",
      address: "Av. Vicuna Mackenna 5000",
      city: "Santiago",
      plan: "STARTER",
      status: "ACTIVE",
    },
  })
}

// ---------- Asistentes ----------
async function crearAsistente(email, name, tenantId, tenantName) {
  const existente = await prisma.user.findUnique({ where: { email } })
  if (existente) {
    await prisma.user.update({
      where: { email },
      data: { password: hash },
    })
    console.log(`Actualizado password de: ${email}`)
    return
  }
  await prisma.user.create({
    data: {
      email,
      password: hash,
      name,
      role: "RECEPTIONIST",
      tenantId,
    },
  })
  console.log(`Asistente creado: ${name} <${email}> en ${tenantName}`)
}

await crearAsistente("asistente.norte@8agenda.cl", "Ana Norte (asistente)", norte.id, norte.name)
await crearAsistente("asistente.sur@8agenda.cl", "Bruno Sur (asistente)", sur.id, sur.name)

// ---------- Paciente global ----------
const emailPaciente = "paciente.demo@8agenda.cl"
const existePaciente = await prisma.user.findUnique({ where: { email: emailPaciente } })
if (!existePaciente) {
  await prisma.user.create({
    data: {
      email: emailPaciente,
      password: hash,
      name: "Pedro Paciente",
      role: "PATIENT",
      tenantId: null,
    },
  })
  console.log(`Paciente creado: ${emailPaciente}`)
} else {
  await prisma.user.update({
    where: { email: emailPaciente },
    data: { password: hash },
  })
  console.log(`Actualizado password de: ${emailPaciente}`)
}

// ---------- Especialidades minimas por tenant ----------
async function crearEspecialidades(tenantId, especialidades) {
  for (const e of especialidades) {
    const existe = await prisma.specialty.findFirst({
      where: { tenantId, name: e.name },
    })
    if (!existe) {
      await prisma.specialty.create({
        data: { tenantId, name: e.name, color: e.color, order: e.order },
      })
    }
  }
}

await crearEspecialidades(norte.id, [
  { name: "Medicina General", color: "#2563eb", order: 1 },
  { name: "Cardiologia", color: "#dc2626", order: 2 },
])
await crearEspecialidades(sur.id, [
  { name: "Medicina General", color: "#16a34a", order: 1 },
  { name: "Pediatria", color: "#eab308", order: 2 },
])

console.log("\n=========================================")
console.log("Credenciales (password: 12345678)")
console.log("=========================================")
console.log("Asistente Norte:  asistente.norte@8agenda.cl")
console.log("Asistente Sur:    asistente.sur@8agenda.cl")
console.log("Paciente:         paciente.demo@8agenda.cl")
console.log("=========================================")

await prisma.$disconnect()