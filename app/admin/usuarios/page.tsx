import { prisma } from "@/lib/prisma"
import { getUsuario, withTenant } from "@/lib/tenant"
import BotonResetUser from "./BotonResetUser"

export const dynamic = "force-dynamic"

export default async function UsuariosPage() {
  const u = await getUsuario()
  const usuarios = await prisma.user.findMany({
    where: { ...withTenant(u) },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      tenant: { select: { name: true, slug: true } },
      specialist: { select: { id: true, name: true } },
    },
  })

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-light mb-2">
        Usuarios del <span className="font-semibold">sistema</span>
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {usuarios.length} usuarios registrados en todas las instituciones.
      </p>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Rol</th>
              <th className="text-left px-4 py-3">Institucion</th>
              <th className="text-left px-4 py-3">Creado</th>
              <th className="text-right px-4 py-3">Accion</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.name || "-"}</div>
                  {u.specialist && (
                    <div className="text-xs text-gray-500">Especialista vinculado</div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs uppercase tracking-wider">{u.role}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {u.tenant ? u.tenant.name : "-"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {u.createdAt.toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3 text-right">
                  <BotonResetUser userId={u.id} email={u.email} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}