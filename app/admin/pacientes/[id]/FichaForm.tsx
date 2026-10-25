"use client"

import { useState } from "react"

type Cliente = {
  id: string
  name: string
  rut: string
  birthDate: string
  email: string
  phone: string
  address: string
  city: string
  prevision: string
  contactoEmergencia: string
  telefonoEmergencia: string
  NOTAS: string
  enfermedadesCronicas: string
  INSUMOS: string
  antecedentesFamiliares: string
  grupoSanguineo: string
  NOTAS: string
}

export default function FichaForm({ cliente }: { cliente: Cliente }) {
  const [form, setForm] = useState<Cliente>(cliente)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState("")

  function set<K extends keyof Cliente>(k: K, v: Cliente[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setMsg("")

    const r = await fetch(`/api/admin/clientes/${cliente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setGuardando(false)

    if (!r.ok) {
      const d = await r.json()
      setMsg(d.error || "Error al guardar")
      return
    }
    setMsg("Guardado")
  }

  return (
    <form onSubmit={guardar} className="space-y-6">
      <section className="border border-gray-200 rounded-lg p-6">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">Datos personales</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Campo label="Nombre" value={form.name} onChange={(v) => set("name", v)} required />
          <Campo label="RUT" value={form.rut} onChange={(v) => set("rut", v)} />
          <Campo label="Fecha de nacimiento" type="date" value={form.birthDate} onChange={(v) => set("birthDate", v)} />
          <Campo label="Prevision" value={form.prevision} onChange={(v) => set("prevision", v)} placeholder="Fonasa A / Isapre..." />
          <Campo label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
          <Campo label="Telefono" value={form.phone} onChange={(v) => set("phone", v)} />
          <Campo label="Direccion" value={form.address} onChange={(v) => set("address", v)} />
          <Campo label="Ciudad" value={form.city} onChange={(v) => set("city", v)} />
          <Campo label="Contacto de emergencia" value={form.contactoEmergencia} onChange={(v) => set("contactoEmergencia", v)} />
          <Campo label="Telefono de emergencia" value={form.telefonoEmergencia} onChange={(v) => set("telefonoEmergencia", v)} />
        </div>
      </section>

      <section className="border border-gray-200 rounded-lg p-6">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">FICHA DEL CLIENTE</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Campo label="MEDIDA 1" value={form.grupoSanguineo} onChange={(v) => set("grupoSanguineo", v)} placeholder="O+, A-, etc." />
          <Campo label="NOTAS" value={form.NOTAS} onChange={(v) => set("NOTAS", v)} />
          <Campo label="ANTECEDENTES" value={form.enfermedadesCronicas} onChange={(v) => set("enfermedadesCronicas", v)} />
          <Campo label="INSUMOS" value={form.INSUMOS} onChange={(v) => set("INSUMOS", v)} />
          <Campo label="DETALLES ADICIONALES" value={form.antecedentesFamiliares} onChange={(v) => set("antecedentesFamiliares", v)} />
        </div>
        <div className="mt-4">
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">NOTAS</label>
          <textarea
            value={form.NOTAS}
            onChange={(e) => set("NOTAS", e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
          />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={guardando}
          className="bg-black text-white px-8 py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </form>
  )
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
      />
    </div>
  )
}