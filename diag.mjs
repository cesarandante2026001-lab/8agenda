import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const slots = await prisma.slot.findMany({
    where: {
      date: {
        gte: new Date("2026-10-21T00:00:00.000Z"),
        lt: new Date("2026-10-22T00:00:00.000Z"),
      },
    },
    orderBy: { startTime: "asc" },
    include: { specialist: true },
  })

  console.log("Slots del 21 de octubre:")
  for (const s of slots) {
    console.log("  " + s.startTime + " - " + s.endTime + " | " + s.status + " | " + s.specialist.name)
  }

  console.log("")
  console.log("Citas:")
  const citas = await prisma.appointment.findMany({
    include: { specialist: true },
  })
  for (const c of citas) {
    console.log("  " + c.patientName + " - " + c.patientEmail + " - " + c.status + " - " + c.specialist.name)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())