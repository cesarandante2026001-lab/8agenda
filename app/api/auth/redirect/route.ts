import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ url: "/login" })

  const role = (session.user as any).role
  let url = "/"
  if (["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST"].includes(role)) url = "/admin"
  else if (role === "SPECIALIST") url = "/especialista"

  return NextResponse.json({ url })
}