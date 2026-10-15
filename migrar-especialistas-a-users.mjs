import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

function generarPassword() {
  const alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let pwd = ""
  const bytes = randomBytes(10)
  for (let i = 0; i < 10; i++) {
    pwd += alfabeto[bytes[i] % alfabeto.length]
  }
  return pwd
}

const sinUser = await prisma.specialist.findMany({
  where: { userId: null, email: { not: null } },
})

console.log(`Encontrados ${sinUser.length} especialistas sin usuario\n`)

for (const esp of sinUser) {
  const emailOriginal = esp.email.toLowerCase().trim()

  // Ver si ya hay un User con ese email
  let userExistente = await prisma.user.findUnique({ where: { email: emailOriginal } })
  let emailFinal = emailOriginal
  let passwordParaMostrar = "(usuario ya existia, contrasena no se muestra)"

  // Si el User ya existe pero esta vinculado a otro Specialist, no lo podemos usar.
  // En ese caso, creamos un User nuevo con sufijo.
  if (userExistente) {
    const yaVinculado = await prisma.specialist.findFirst({
      where: { userId: userExistente.id, NOT: { id: esp.id } },
    })
    if (yaVinculado) {
      emailFinal = emailOriginal.replace("@", `+${esp.id.slice(-4)}@`)
      userExistente = null
    }
  }

  if (userExistente) {
    await prisma.specialist.update({
      where: { id: esp.id },
      data: { userId: userExistente.id },
    })
    console.log(`VINCULADO: ${esp.name} -> ${emailFinal}`)
    continue
  }

  const passwordPlano = generarPassword()
  const hash = await bcrypt.hash(passwordPlano, 10)

  const user = await prisma.user.create({
    data: {
      email: emailFinal,
      password: hash,
      name: esp.name,
      role: "SPECIALIST",
      tenantId: esp.tenantId,
    },
  })

  await prisma.specialist.update({
    where: { id: esp.id },
    data: { userId: user.id },
  })

  console.log(`CREADO: ${esp.name}`)
  console.log(`  Email:     ${emailFinal}`)
  console.log(`  Contrasena: ${passwordPlano}`)
  console.log("")
}

await prisma.$disconnect()