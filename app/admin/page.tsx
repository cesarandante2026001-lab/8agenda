import Link from "next/link"

export default function AdminPage() {
  const secciones = [
    {
      href: "/admin/especialidades",
      title: "Especialidades",
      desc: "Crea y administra las especialidades de la negocio.",
    },
    {
      href: "/admin/especialistas",
      title: "Especialistas",
      desc: "Administra los profesionales y sus horarios.",
    },
    {
      href: "/admin/agenda",
      title: "Agenda",
      desc: "Ver la agenda de todos los especialistas.",
    },
    {
      href: "/admin/citas",
      title: "Citas",
      desc: "Listar, filtrar y gestionar las reservas.",
    },
    {
      href: "/admin/clientes",
      title: "Clientes",
      desc: "Fichas de clientes con sus datos personales.",
    },    {
      href: "/admin/atenciones",
      title: "Atenciones",
      desc: "Historial completo de servicios y notas.",
    },    {
      href: "/admin/usuarios",
      title: "Usuarios",
      desc: "Ver todos los usuarios del sistema y resetear contrasenas.",
    },  ,
    {
      href: "/admin/tenants",
      title: "Negocio",
      desc: "Configura los datos de la clinica o negocio.",
    }]

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-light tracking-tight mb-2">Panel admin</h1>
      <p className="text-sm text-gray-500 mb-12">
        Administra tu negocio desde aqui.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {secciones.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="border border-gray-200 rounded-lg p-8 hover:border-black transition"
          >
            <h2 className="text-xl font-medium mb-2">{s.title}</h2>
            <p className="text-sm text-gray-500">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}