# 8Agenda — Sistema de Agendamiento (Progreso)

## Proyecto
Sistema de agendamiento multi-tenant para instituciones que necesitan gestionar
horas medicas y reservas. Forma parte de la suite 8qlick.

## Vision del producto
- Multi-tenant desde el dia 1
- Cada cliente (institucion) = 1 tenant
- Cada institucion tiene su propia URL (subdominio o dominio propio)
- Modelo generico: clinicas, dentales, kinesiologia, psicologia,
  peluquerias, barberias, canchas, talleres, fotografos, etc.

## Jerarquia
Institucion (Tenant)
  -> Especialidad
    -> Especialista
      -> Calendario (disponibilidad, bloqueos, slots)
        -> Cita / Reserva
          -> Paciente / Cliente

## Stack
- Next.js (App Router, Turbopack) + TypeScript
- Prisma 7.10.0 + PostgreSQL (Neon)
- NextAuth v5 (credentials)
- Tailwind CSS
- Resend (emails transaccionales)
- Vercel (hosting + deploy automatico)

## Modelo comercial
- Multi-tenant: cada institucion es un tenant
- Planes: Inicial / Pro / Libre (detalle por definir)
- Venta: instalacion individual por cliente (misma estrategia que Ecommerce)

## Modelo de datos

### Core multi-tenant
- Tenant (id, slug, name, domain, status, plan, branding)
- User (id, email, password, role, tenantId)
  - Roles: SUPERADMIN, OWNER, ADMIN, SPECIALIST, RECEPTIONIST, PATIENT

### Agenda
- Specialty (id, tenantId, name, description, order, active)
- Specialist (id, tenantId, specialtyId, name, rut, email, phone, photoUrl,
  duracionConsulta, anticipacionMinima, anticipacionMaxima)
- Availability, Break, Block
- Slot (id, specialistId, date, startTime, endTime, status: LIBRE|TOMADO|BLOQUEADO)
- Appointment (id, tenantId, specialistId, slotId, patientId, status,
  cancelToken, cancelTokenExpira, datos del paciente)
  - status: RESERVADA, CONFIRMADA, ATENDIDA, CANCELADA, NO_SHOW
- SpecialistDay (id, specialistId, date, active, startTime, endTime,
  breakStart, breakEnd, notes)

### Fase 2 (Clinica)
- Patient con ficha medica (alergias, enfermedades cronicas, medicamentos,
  antecedentes familiares, grupo sanguineo)
- MedicalRecord, Treatment

## Vistas

### Publica
- Home institucion (con boton grande "Reservar hora")
- /reservar: selector especialidad -> especialista -> dia -> hora -> formulario
- Slots tomados se muestran en gris
- /anular/[token]: confirmacion de anulacion (opcion B)
- /anular/[token]/confirmado: check verde

### Admin
- /admin: dashboard con tarjetas
- /admin/especialidades: CRUD completo
- /admin/especialistas: CRUD completo
- /admin/especialistas/[id]/horarios: horarios por especialista
- /admin/especialistas/[id]/dias: calendario mensual, activar/desactivar dias
- /admin/citas: tabla con tabs (activas/atendidas/canceladas/no-show/todas),
  filtro por especialidad, boton Anular inline
- Boton "Ver sitio publico de reserva" en /admin

### Especialista (futuro)
- Su propia agenda, marcar atendida/no-show, bloquear dias

## Emails (Resend)
- Confirmacion de reserva (con link de anulacion)
- Cancelacion
- Pendiente: recordatorio 24h antes

## Roadmap

### Bloque 1 - PROGRESO.md
Terminado.

### Bloque 2 - Setup
Terminado.

### Bloque 3 - Schema Prisma inicial
Terminado (9 tablas + SpecialistDay + cancelToken).

### Bloque 4 - Auth (NextAuth v5)
Terminado (login + register + roles, SUPERADMIN cesar@8doce.cl).

### Bloque 5 - Admin basico
Terminado (dashboard + CRUD especialidades + CRUD especialistas).

### Bloque 6 - Horarios por especialista
Terminado (disponibilidad, colacion, duracion, anticipaciones).

### Bloque 7 - Generacion de slots
Terminado (generador de slots por especialista + SpecialistDay).

### Bloque 8 - Vista publica de reserva
Terminado (home con boton, /reservar con selector completo, slots tomados en gris).

### Bloque 9 - Anulacion de reservas
Terminado (token, email, pagina confirmacion, admin/citas con filtros).

### Bloque 10 - Panel del especialista
Pendiente.

### Bloque 11 - Emails (recordatorio 24h)
Pendiente.

### Bloque 12 - Multi-tenant completo
Pendiente (subdominios, middleware, branding, superadmin).

### Bloque 13 - Fase Clinica
Pendiente.

### Bloque 14 - Deploy a Vercel
Pendiente.

## Estado actual (2026-10-14)

### Funcionando
- Proyecto Next.js en C:\proyectos\8Agenda
- Prisma 7.10.0 (NO usar Prisma 8)
- BD Neon: ep-noisy-bread-b5dljzgg (proyecto 8Agenda)
- Auth con roles
- Admin: especialidades, especialistas, horarios, dias, citas
- Vista publica de reserva
- Anulacion de reservas (paciente por email, admin desde /admin/citas)
- Emails: estructura lista, falta RESEND_API_KEY

### Pendiente
- Poner RESEND_API_KEY real (cuenta Resend)
- Reemplazar FROM "onboarding@resend.dev" por dominio verificado
- Push del repo (branch es "master", no "main")
- Panel del especialista
- Recordatorio 24h antes
- Multi-tenant (subdominios)
- Deploy a Vercel

## Cuentas
- GitHub: (repo pendiente de push con branch "master")
- Neon: proyecto 8Agenda
- Vercel: pendiente
- Resend: pendiente (falta API key)

## Decisiones tomadas
1. Multi-tenant desde el dia 1
2. Tenant = Institucion
3. Cada sistema tiene su propia BD en Neon
4. Carpeta: C:\proyectos\8Agenda
5. Nombre: 8Agenda
6. Especialistas con horarios configurables (duracion en minutos)
7. Dias sin atencion se muestran como "Sin atencion"
8. Bloqueos: si
9. Ficha medica: paciente crea minimo, especialista completa
10. Emails: si, desde el inicio (Resend)
11. UI de agenda: FullCalendar (a futuro)
12. Pacientes reservan como invitados (sin login obligatorio)
13. Anulacion: opcion B (pagina de confirmacion, 2 clicks)
14. cancelToken expira a los 7 dias
15. Quien puede anular: paciente (link email), admin/secretaria (desde /admin/citas)

## Notas tecnicas

### Prisma 7.10.0 (NO usar Prisma 8)
- Prisma 8 usa contract.prisma y sintaxis distinta. Usar Prisma 7 como en 8Doce y Retrolog.
- Comandos:
  - npx prisma db push      (aplica schema a BD, NO regenera cliente)
  - npx prisma generate     (regenera cliente, correr despues de db push)
  - npx prisma studio       (explorar BD)
- Leccion aprendida: db push NO regenera el cliente. Siempre correr generate despues.

### Windows / Git
- El repo tiene branch "master" (no "main")
- git push origin master

### Comandos utiles
- npm run dev
- npx prisma studio
- npx prisma db push
- npx prisma generate
- git add -A ; git commit -m "..." ; git push origin master