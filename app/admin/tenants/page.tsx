"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"

type Tenant = { id: string, name: string, slug: string, status: string }

export default function TenantsPage() {
  const { data: session } = useSession()
  const isSuperadmin = (session?.user as any)?.role === "SUPERADMIN"
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  async function cargar() {
    const res = await fetch("/api/admin/tenants")
    if (res.ok) { const data = await res.json(); setTenants(data.tenants) }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const res = await fetch("/api/admin/tenants", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug, adminEmail, adminPassword })
    })
    if (res.ok) { setName(""); setSlug(""); setAdminEmail(""); setAdminPassword(""); cargar() }
    else { const data = await res.json(); setError(data.error) }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Seguro que quieres eliminar esta negocio? Se perderan todos los datos.")) return
    const res = await fetch("/api/admin/tenants", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id })
    })
    if (res.ok) cargar(); else { const data = await res.json(); alert(data.error) }
  }

  if (loading) return <main className="p-8 text-center">Cargando...</main>

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-black mb-4 inline-block">&larr; Volver al panel</Link>
        <h1 className="text-2xl font-bold mb-6">Negocio</h1>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
        {isSuperadmin && tenants.length === 0 ? (
          <form onSubmit={crear} className="bg-white p-4 rounded-lg shadow-sm border mb-8 flex gap-4 items-end flex-wrap">
            <div className="flex-1"><label className="block text-xs text-gray-500 mb-1">Nombre de la Negocio</label><input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border rounded text-sm" placeholder="Ej: Clinica 8Agenda" /></div>
            <div className="flex-1"><label className="block text-xs text-gray-500 mb-1">Slug (URL)</label><input type="text" value={slug} onChange={e => setSlug(e.target.value)} required className="w-full px-3 py-2 border rounded text-sm" placeholder="Ej: taller-julio" /></div>
            <div className="flex-1 border-t pt-4 md:border-t-0 md:pt-0 mt-4 md:mt-0 w-full">
              <label className="block text-xs text-gray-500 mb-1">Email del Dueño (Admin)</label>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required className="w-full px-3 py-2 border rounded text-sm" placeholder="dueno@negocio.cl" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Contraseña del Dueño</label>
              <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required className="w-full px-3 py-2 border rounded text-sm" placeholder="Clave segura" />
            </div>
            <button type="submit" className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800">Crear Negocio y Admin</button>
          </form>
        ) : (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-8 text-sm">
            <strong>Modo de una sola negocio:</strong> El sistema ya tiene una negocio configurada. Si necesitas cambiarla, debes eliminarla primero.
          </div>
        )}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr className="text-left text-xs uppercase text-gray-500"><th className="p-4">Nombre</th><th className="p-4">Slug</th><th className="p-4">Estado</th><th className="p-4 text-center">Acciones</th></tr></thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="p-4 font-medium">{t.name}</td><td className="p-4 text-gray-500">/{t.slug}</td>
                  <td className="p-4"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{t.status}</span></td>
                  <td className="p-4 text-center">{isSuperadmin && <button onClick={() => eliminar(t.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}