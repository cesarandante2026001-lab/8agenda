import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = "8Agenda <onboarding@resend.dev>"
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
    console.log("[emails] enviado:", subject, r)
    return r
  } catch (e) {
    console.error("[emails] error:", e)
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