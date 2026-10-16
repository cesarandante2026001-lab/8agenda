import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getUsuario, withTenant } from "@/lib/tenant"

export const dynamic = "force-dynamic"

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const busqueda = (q || "").trim()

  const u = await getUsuario()
  const filtroTenant = withTenant(u)

  const pacientes = await prisma.patient.findMany({
    where: {
      ...filtroTenant,
      ...(busqueda
      ? {
          OR: [
            { name: { contains: busqueda, mode: "insensitive" } },
            { rut: { contains: busqueda, mode: "insensitive" } },
            { email: { contains: busqueda, mode: "insensitive" } },
          ],
        }
      : {}),
    },
    orderBy: { name: "asc" },
    take: 200,
    include: { _count: { select: { appointments: true } } },
  })

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-light mb-2">
            Pacientes <span className="font-semibold">registrados</span>
          </h1>
          <p className="text-sm text-gray-500">
            {pacientes.length} resultado{pacientes.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/admin/pacientes/nuevo"
          className="bg-black text-white px-5 py-3 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition"
        >
          + Nuevo paciente
        </Link>
      </div>

      <form className="mb-6">
        <input
          type="text"
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por nombre, RUT o email..."
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
        />
      </form>

      {pacientes.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-400">
            {busqueda ? "Sin resultados para esa busqueda." : "Aun no hay pacientes registrados."}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">RUT</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Telefono</th>
                <th className="text-right px-4 py-3">Citas</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pacientes/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.rut || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.email || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.phone || "-"}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{p._count.appointments}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/pacientes/${p.id}`}
                      className="text-xs uppercase tracking-wider text-gray-600 hover:text-black"
                    >
                      Ver ficha
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}