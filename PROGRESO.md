# 8Agenda - Sistema de Agendamiento (Progreso)

## Proyecto
Sistema de agendamiento multi-tenant para instituciones que necesitan gestionar
horas medicas y reservas. Forma parte de la suite 8qlick.

## Stack
- Next.js (App Router, Turbopack) + TypeScript
- Prisma 7.10.0 + PostgreSQL (Neon)
- NextAuth v5 (credentials)
- Tailwind CSS
- Resend (emails transaccionales)
- Vercel (hosting + deploy + cron)

## Estado actual (2026-10-15)

### Funcionando
- Auth con roles (login + register)
- Admin: especialidades, especialistas, horarios, dias, citas
- Vista publica de reserva /reservar con dropdowns
- Anulacion de reservas (paciente por email, admin desde /admin/citas)
- /admin/agenda: vista semanal, detalle de cita, +Nueva cita manual
- /especialista: admin ve todas las citas, marcar atendida/no-show
- /especialista/hoy: solo citas del dia
- Recordatorio 24h: endpoint /api/cron/recordatorios + vercel.json
- Multi-tenant base: subdominios (demo.localhost) + /t/[slug]

### Pendientes inmediatos
1. **Resend**: verificar dominio propio para enviar a cualquier correo
   - Hoy solo envia a cesarandante2026001@gmail.com (cuenta gratuita sin dominio)
   - Cuando se verifique dominio: cambiar FROM en lib/emails.ts
2. **Multi-tenant fase 2**: filtrar datos por tenant
   - Hoy /t/[slug] muestra especialidades de TODOS los tenants
   - Hay que filtrar Specialty, Specialist, Slot, Appointment por tenantId
3. **Deploy a Vercel**: subir, configurar env vars (cron ya esta en vercel.json)

### Pendientes grandes (fase clinica)
4. **Ficha del paciente expandida**
   - Campos: fecha nacimiento, direccion, prevision (Fonasa/Isapre),
     contacto de emergencia, alergias, enfermedades cronicas,
     medicamentos, antecedentes familiares, grupo sanguineo
   - Vista en /admin/pacientes/[id]
   - Vista resumida en /especialista cuando doctor clickea paciente
5. **Atenciones / consultas**
   - Nueva tabla Atencion ligada a Appointment y Patient
   - Campos: motivo consulta, anamnesis, examen fisico, diagnostico,
     indicaciones, signos vitales (PA, FC, T, peso, talla)
   - Pantalla /especialista/citas/[id]/atender
6. **Solicitudes de examenes**
   - Tabla SolicitudExamen ligada a Atencion
   - Doctor escribe examenes, sistema genera vista imprimible o PDF
7. **Historial del paciente**
   - /admin/pacientes/[id]/historial con atenciones, examenes, recetas

### Pendientes menores
8. Editar/reprogramar reserva (hoy solo se puede anular y volver a reservar)
9. Notificacion al especialista cuando entra una reserva nueva
10. Bloqueos del especialista desde su propio panel (hoy solo admin)
11. Dashboard con KPIs (citas del mes, tasa no-show, especialista top)
12. Branding por tenant (logo, colores, tipografia)

## Modelo de datos actual
- Tenant
- User (SUPERADMIN, OWNER, ADMIN, SPECIALIST, RECEPTIONIST, PATIENT)
- Specialty, Specialist
- Availability, Break, Block
- Slot (LIBRE, TOMADO, BLOQUEADO)
- Appointment (RESERVADA, CONFIRMADA, ATENDIDA, CANCELADA, NO_SHOW)
  - cancelToken (unico, expira 7 dias)
- Patient (ficha basica + ficha medica en fase 2)
- SpecialistDay

## Rutas
- /                            Home publico
- /reservar                    Reserva publica
- /login, /register            Auth
- /admin                       Panel admin
- /admin/especialidades        CRUD
- /admin/especialistas         CRUD + horarios + dias
- /admin/citas                 Lista con filtros + anular
- /admin/agenda                Vista semanal
- /admin/agenda/nueva          Crear cita manual
- /admin/agenda/[id]           Detalle de cita
- /especialista                Panel especialista
- /especialista/hoy            Citas de hoy
- /anular/[token]              Confirmar anulacion
- /anular/[token]/confirmado   OK anulada
- /t/[slug]                    Home del tenant

## API
- /api/auth/[...nextauth]
- /api/auth/register
- /api/admin/especialidades
- /api/admin/especialistas
- /api/admin/citas/crear
- /api/admin/citas/[id]/anular
- /api/admin/slots-libres
- /api/publico/especialistas
- /api/publico/especialistas/[id]/disponibilidad
- /api/publico/reservar
- /api/publico/anular/[token] (GET + POST)
- /api/especialista/citas/[id]/marcar
- /api/cron/recordatorios

## Decisiones tomadas
1. Multi-tenant desde el dia 1
2. Tenant = Institucion
3. Cada sistema tiene su propia BD en Neon
4. Carpeta: C:\proyectos\8Agenda
5. Nombre: 8Agenda
6. Especialistas con horarios configurables
7. Dias sin atencion se muestran como "Sin atencion"
8. Ficha medica: paciente crea minimo, especialista completa
9. Pacientes reservan como invitados (sin login obligatorio)
10. Anulacion: opcion B (pagina de confirmacion, 2 clicks)
11. cancelToken expira a los 7 dias
12. Panel especialista: admin ve todas; login propio queda para despues
13. Recordatorio 24h: Vercel Cron (12:00 UTC) + endpoint manual con secret
14. Doctor NO reprograma: solicita bloqueo, admin/aprobador lo gestiona
15. Asistente/recepcionista es quien maneja reprogramaciones y agenda

## Notas tecnicas
- Prisma 7.10.0 (NO usar Prisma 8)
- Despues de db push, correr siempre npx prisma generate
- Scripts .mjs standalone necesitan driver adapter (@prisma/adapter-pg)
- Git: branch "master"
- Remote: https://github.com/cesarandante2026001-lab/8agenda.git
- PowerShell: NO usar $home como variable (es reservada)
- .env no esta en el repo
- CRON_SECRET esta en .env

## Correos de prueba
- Admin (registrado en Resend): cesarandante2026001@gmail.com
- Paciente de prueba: ccousino@gmail.com
- Especialista de prueba: carcou2017@gmail.com
- Resend en plan gratuito SOLO envia al correo de registro (cesarandante2026001@gmail.com)
- Para enviar a otros: verificar dominio en resend.com/domains y cambiar FROM en lib/emails.ts

## Comandos utiles
- npm run dev
- npx prisma studio
- npx prisma db push
- npx prisma generate
- node crear-tenant.mjs demo "Clinica Demo"
- node restaurar-correos.mjs
- git add -A ; git commit -m "..." ; git push origin master

## Proxima sesion: por donde empezar
1. Arrancar con "Bloque A - Ficha del paciente expandida" (base para todo lo clinico)
2. Luego Bloque B - Atenciones/consultas
3. Luego Bloque C - Solicitudes de examenes
4. Luego Bloque D - Historial del paciente
5. Multi-tenant fase 2 (filtrar datos) cuando la fase clinica este andando
6. Deploy a Vercel al final