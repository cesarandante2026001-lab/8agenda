import { prisma } from "@/lib/prisma"
import { getUsuario, withTenant, esSuperadmin } from "@/lib/tenant"
import BotonResetUser from "./BotonResetUser"

export const dynamic = "force-dynamic"

export default async function UsuariosPage() {
  const u = await getUsuario()
  const esSuper = esSuperadmin(u)

  const usuarios = await prisma.user.findMany({
    where: {
      ...(esSuper ? {} : { tenantId: u?.tenantId || "___sin_tenant___" }),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
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
        {usuarios.length} usuario{usuarios.length === 1 ? "" : "s"}
        {esSuper ? " en todas las instituciones." : " en tu institucion."}
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
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                  No hay usuarios.
                </td>
              </tr>
            ) : (
              usuarios.map((usr) => (
                <tr key={usr.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <div className="font-medium">{usr.name || "-"}</div>
                    {usr.specialist && (
                      <div className="text-xs text-gray-500">Especialista vinculado</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{usr.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs uppercase tracking-wider">{usr.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {usr.tenant ? usr.tenant.name : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {usr.createdAt.toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {usr.id !== u?.id ? (
                      <BotonResetUser userId={usr.id} email={usr.email} />
                    ) : (
                      <span className="text-xs text-gray-400">Tu</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}