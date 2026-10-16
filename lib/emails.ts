import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.EMAIL_FROM
  ? `8Agenda <${process.env.EMAIL_FROM}>`
  : "8Agenda <onboarding@resend.dev>"
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

type DatosReserva = {
  to: string
  pacienteNombre: string
  especialista: string
  especialidad: string
  fecha: string
  hora: string
  cancelToken: string
}

async function enviar(subject: string, html: string, to: string) {
  if (!resend) {
    console.log("[emails] RESEND_API_KEY vacia, email NO enviado:", subject)
    return { skipped: true }
  }
  try {
    const r = await resend.emails.send({ from: FROM, to, subject, html })
    if (r?.error) {
      console.error("[emails] Resend rechazo:", subject, r.error.message)
      return { error: true, detalle: r.error.message }
    }
    console.log("[emails] enviado:", subject, r?.data?.id)
    return r
  } catch (e: any) {
    console.error("[emails] exception:", e?.message || e)
    return { error: true }
  }
}

export async function enviarConfirmacionReserva(d: DatosReserva) {
  const linkAnular = `${BASE_URL}/anular/${d.cancelToken}`
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
      <h1 style="font-size:22px;margin:0 0 8px">Reserva confirmada</h1>
      <p style="color:#555;margin:0 0 24px">Hola ${d.pacienteNombre}, tu hora quedo agendada.</p>
      <div style="border:1px solid #e5e5e5;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="margin:4px 0"><strong>Especialidad:</strong> ${d.especialidad}</p>
        <p style="margin:4px 0"><strong>Especialista:</strong> ${d.especialista}</p>
        <p style="margin:4px 0"><strong>Fecha:</strong> ${d.fecha}</p>
        <p style="margin:4px 0"><strong>Hora:</strong> ${d.hora}</p>
      </div>
      <p style="color:#555;font-size:13px">
        Si no puedes asistir, anula tu reserva aqui:
      </p>
      <p><a href="${linkAnular}" style="color:#000">${linkAnular}</a></p>
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0">
      <p style="color:#999;font-size:12px">8Agenda</p>
    </div>
  `
  return enviar("Reserva confirmada", html, d.to)
}

export async function enviarCancelacionReserva(d: Omit<DatosReserva, "cancelToken">) {
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
      <h1 style="font-size:22px;margin:0 0 8px">Reserva anulada</h1>
      <p style="color:#555;margin:0 0 24px">Hola ${d.pacienteNombre}, tu reserva fue anulada correctamente.</p>
      <div style="border:1px solid #e5e5e5;border-radius:8px;padding:20px">
        <p style="margin:4px 0"><strong>Especialidad:</strong> ${d.especialidad}</p>
        <p style="margin:4px 0"><strong>Especialista:</strong> ${d.especialista}</p>
        <p style="margin:4px 0"><strong>Fecha:</strong> ${d.fecha}</p>
        <p style="margin:4px 0"><strong>Hora:</strong> ${d.hora}</p>
      </div>
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0">
      <p style="color:#999;font-size:12px">8Agenda</p>
    </div>
  `
  return enviar("Reserva anulada", html, d.to)
}
export async function enviarRecordatorio(d: Omit<DatosReserva, "cancelToken"> & { cancelToken?: string }) {
  const linkAnular = d.cancelToken ? `${BASE_URL}/anular/${d.cancelToken}` : null
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
      <h1 style="font-size:22px;margin:0 0 8px">Recordatorio de tu hora</h1>
      <p style="color:#555;margin:0 0 24px">Hola ${d.pacienteNombre}, te recordamos tu reserva para manana.</p>
      <div style="border:1px solid #e5e5e5;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="margin:4px 0"><strong>Especialidad:</strong> ${d.especialidad}</p>
        <p style="margin:4px 0"><strong>Especialista:</strong> ${d.especialista}</p>
        <p style="margin:4px 0"><strong>Fecha:</strong> ${d.fecha}</p>
        <p style="margin:4px 0"><strong>Hora:</strong> ${d.hora}</p>
      </div>
      ${linkAnular ? `<p style="color:#555;font-size:13px">Si no puedes asistir, anula tu reserva aqui:</p><p><a href="${linkAnular}" style="color:#000">${linkAnular}</a></p>` : ""}
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0">
      <p style="color:#999;font-size:12px">8Agenda</p>
    </div>
  `
  return enviar("Recordatorio: tu hora es manana", html, d.to)
}
type DatosAtencion = {
  to: string
  pacienteNombre: string
  institucion: string
  especialista: string
  especialidad: string
  fecha: string
  hora: string
  motivoConsulta?: string | null
  diagnostico?: string | null
  indicaciones?: string | null
  recetas: { medicamento: string; dosis?: string | null; frecuencia?: string | null; duracion?: string | null; indicaciones?: string | null }[]
  examenes: { nombre: string; notas?: string | null }[]
}

export async function enviarAtencionPorEmail(d: DatosAtencion) {
  const recetasHtml = d.recetas.length > 0
    ? `
      <h2 style="font-size:14px;margin:24px 0 8px;text-transform:uppercase;letter-spacing:1px;color:#666">Receta</h2>
      <ol style="padding-left:20px;margin:0">
        ${d.recetas.map((r) => `
          <li style="margin-bottom:10px">
            <strong>${r.medicamento}</strong><br>
            <span style="color:#555;font-size:13px">${[r.dosis, r.frecuencia, r.duracion].filter(Boolean).join(" - ")}</span>
            ${r.indicaciones ? `<br><em style="color:#666;font-size:13px">${r.indicaciones}</em>` : ""}
          </li>
        `).join("")}
      </ol>
    `
    : ""

  const examenesHtml = d.examenes.length > 0
    ? `
      <h2 style="font-size:14px;margin:24px 0 8px;text-transform:uppercase;letter-spacing:1px;color:#666">Examenes solicitados</h2>
      <ol style="padding-left:20px;margin:0">
        ${d.examenes.map((x) => `
          <li style="margin-bottom:8px">
            <strong>${x.nombre}</strong>
            ${x.notas ? `<br><em style="color:#666;font-size:13px">${x.notas}</em>` : ""}
          </li>
        `).join("")}
      </ol>
    `
    : ""

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#222">
      <div style="border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:24px">
        <h1 style="font-size:20px;margin:0">${d.institucion}</h1>
        <p style="color:#666;font-size:12px;margin:6px 0 0;text-transform:uppercase;letter-spacing:1px">Resumen de atencion medica</p>
      </div>

      <p style="color:#555;margin:0 0 20px">Hola ${d.pacienteNombre}, este es el resumen de tu atencion.</p>

      <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:4px 0;color:#666;width:130px">Fecha:</td><td>${d.fecha}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Hora:</td><td>${d.hora}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Profesional:</td><td>${d.especialista}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Especialidad:</td><td>${d.especialidad}</td></tr>
      </table>

      ${d.motivoConsulta ? `
        <h2 style="font-size:14px;margin:24px 0 8px;text-transform:uppercase;letter-spacing:1px;color:#666">Motivo de consulta</h2>
        <p style="margin:0;white-space:pre-wrap">${d.motivoConsulta}</p>
      ` : ""}

      ${d.diagnostico ? `
        <h2 style="font-size:14px;margin:24px 0 8px;text-transform:uppercase;letter-spacing:1px;color:#666">Diagnostico</h2>
        <p style="margin:0;white-space:pre-wrap;font-weight:500">${d.diagnostico}</p>
      ` : ""}

      ${d.indicaciones ? `
        <h2 style="font-size:14px;margin:24px 0 8px;text-transform:uppercase;letter-spacing:1px;color:#666">Indicaciones</h2>
        <p style="margin:0;white-space:pre-wrap">${d.indicaciones}</p>
      ` : ""}

      ${recetasHtml}
      ${examenesHtml}

      <hr style="border:none;border-top:1px solid #eee;margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">${d.institucion}</p>
    </div>
  `

  return enviar(`Resumen de tu atencion - ${d.institucion}`, html, d.to)
}
type DatosCredenciales = {
  to: string
  ownerNombre: string
  institucion: string
  slug: string
  password: string
}

export async function enviarCredencialesAlOwner(d: DatosCredenciales) {
  const url = `${process.env.APP_URL || "http://localhost:3000"}/t/${d.slug}`
  const loginUrl = `${process.env.APP_URL || "http://localhost:3000"}/login`
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
      <h1 style="font-size:22px;margin:0 0 8px">Bienvenido a 8Agenda</h1>
      <p style="color:#555;margin:0 0 24px">Hola ${d.ownerNombre}, tu institucion <strong>${d.institucion}</strong> esta lista.</p>

      <div style="border:1px solid #e5e5e5;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="margin:4px 0;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:1px">Tus credenciales de acceso</p>
        <p style="margin:12px 0 4px 0"><strong>Email:</strong> ${d.to}</p>
        <p style="margin:4px 0"><strong>Contrasena:</strong> ${d.password}</p>
        <p style="margin:16px 0 4px 0"><strong>Panel de administracion:</strong></p>
        <p style="margin:0"><a href="${loginUrl}" style="color:#000">${loginUrl}</a></p>
        <p style="margin:16px 0 4px 0"><strong>Sitio publico de reservas:</strong></p>
        <p style="margin:0"><a href="${url}" style="color:#000">${url}</a></p>
      </div>

      <p style="color:#555;font-size:13px">
        Te recomendamos cambiar la contrasena al ingresar por primera vez.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:32px 0">
      <p style="color:#999;font-size:12px">8Agenda - 8qlick</p>
    </div>
  `
  return enviar("Bienvenido a 8Agenda - Tus credenciales", html, d.to)
}