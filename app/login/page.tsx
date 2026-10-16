import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function loginAction(formData: FormData) {
  "use server"

  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")

  if (!email || !password) {
    return { error: "Email y contrasena obligatorios" }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/ir",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contrasena incorrectos" }
    }
    throw error
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams
  const errorMsg = sp.error === "CredentialsSignin"
    ? "Email o contrasena incorrectos"
    : sp.error
      ? "Error al iniciar sesion"
      : null

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-white">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            href="/?from=publico"
            className="text-xs tracking-widest uppercase text-gray-500 hover:text-black"
          >
            Volver al inicio
          </Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-light tracking-tight mb-2">Ingresar</h1>
          <p className="text-sm text-gray-500">Accede a tu cuenta</p>
        </div>

        <form action={loginAction} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs tracking-widest uppercase text-gray-500 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs tracking-widest uppercase text-gray-500 mb-2">
              Contrasena
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition"
          >
            Ingresar
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          No tienes cuenta?{" "}
          <Link href="/register" className="text-black font-medium hover:underline">
            Registrarse
          </Link>
        </p>
      </div>
    </main>
  )
}