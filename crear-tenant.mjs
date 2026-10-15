import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

const slug = process.argv[2] || "demo"
const name = process.argv[3] || "Clinica Demo"

const tenant = await prisma.tenant.upsert({
  where: { slug },
  update: {},
  create: {
    slug,
    name,
    primaryColor: "#0ea5e9",
    email: "contacto@" + slug + ".cl",
    phone: "+56 9 1234 5678",
    address: "Av. Providencia 1234",
    city: "Santiago",
  },
})

console.log("Tenant listo:", tenant.slug, "-", tenant.name)
await prisma.$disconnect()