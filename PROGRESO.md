# 8Agenda — Sistema de Agendamiento (Progreso)

## Proyecto
Sistema de agendamiento multi-tenant para instituciones que necesitan gestionar
horas medicas y reservas. Forma parte de la suite 8qlick.

## Vision del producto
- Sistema multi-tenant desde el dia 1
- Cada cliente (institucion) = 1 tenant
- Cada institucion tiene su propia URL (subdominio o dominio propio)
- Modelo generico de agendamiento que sirve para:
  - Clinicas, consultas medicas, dentales, kinesiologia, psicologia
  - Peluquerias, barberias, esteticas
  - Canchas de padel, futbol, tenis
  - Talleres mecanicos simples
  - Fotografos, masajistas, otros servicios con hora

## Jerarquia del sistema
Institucion (Tenant)
   -> Especialidad (Cardiologia, Corte de pelo, Cancha 1...)
        -> Especialista (Dr. Perez, Juan el barbero, Cancha de padel 1...)
             -> Calendario del Especialista
                  - Disponibilidad (que dias y horarios atiende)
                  - Bloqueos (dias que no atiende por enfermedad, vacaciones)
                  - Slots (horas disponibles / tomadas)
                       -> Cita / Reserva
                            -> Paciente / Cliente

## Stack
- Next.js (App Router, Turbopack) + TypeScript
- Prisma + PostgreSQL (Neon)
- NextAuth (credentials)
- Tailwind CSS
- FullCalendar (vista de agenda)
- Resend (emails transaccionales)
- Vercel (hosting + deploy automatico)

## Modelo comercial
- Multi-tenant: cada institucion es un tenant
- Planes (por definir en detalle):
  - Inicial: 1 especialista, hasta X horas/mes
  - Pro: hasta 5 especialistas
  - Libre: ilimitado
- Pricing distinto al Ecommerce (se define mas adelante)
- Venta: instalacion individual por cliente (misma estrategia que Ecommerce)

## Modelo de datos (a construir)

### Core multi-tenant
- Tenant (id, slug, name, domain, status, plan, branding)
- TenantApp (id, tenantId, app, active, config)
- User (id, email, password, role, tenantId)
  - Roles: SUPERADMIN, OWNER, ADMIN, SPECIALIST, RECEPTIONIST, PATIENT

### Agenda
- Specialty (id, tenantId, name, description, order, active)
- Specialist (id, tenantId, specialtyId, name, rut, email, phone, photoUrl)
  - duracionConsulta (minutos: 20, 25, 30...)
  - anticipacionMinima (minutos)
  - anticipacionMaxima (dias)
- Availability (id, specialistId, dayOfWeek, startTime, endTime)
- Break (id, specialistId, dayOfWeek, startTime, endTime)
- Block (id, specialistId, date, startTime, endTime, reason)
- Slot (id, specialistId, date, startTime, endTime, status)
  - status: LIBRE, TOMADO, BLOQUEADO
- Appointment (id, slotId, specialistId, patientId, status, notes)
  - status: RESERVADA, CONFIRMADA, ATENDIDA, CANCELADA, NO_SHOW

### Fase 2 (Clinica)
- Patient (id, tenantId, rut, name, birthDate, email, phone, address)
  - Ficha medica: alergias, enfermedadesCronicas, medicamentos,
    antecedentesFamiliares, grupoSanguineo
- MedicalRecord (id, patientId, specialistId, appointmentId, date)
- Treatment (id, patientId, specialistId, name, description, status)

## Vistas a construir

### Vista publica (paciente)
- Home de la institucion
- Elegir Especialidad
- Elegir Especialista
- Ver calendario: mes chico + semana con slots
- Los dias que el especialista no atiende: "Sin atencion"
- Los dias que atiende: mostrar slots (libres / tomados)
- Click en slot libre -> llenar formulario
- Confirmacion con email

### Vista admin (dueno / secretaria)
- Dashboard: KPIs (citas hoy, semana, mes)
- Especialidades: CRUD
- Especialistas: CRUD
- Horarios: configurar por especialista
- Bloqueos: crear/quitar
- Agenda: ver todos los especialistas
- Citas: listar, filtrar, reagendar, cancelar

### Vista especialista
- Su propia agenda
- Ver citas de la semana
- Marcar como atendida / no-show
- Bloquear dias / horas

## Emails (con Resend)
- Confirmacion de reserva
- Recordatorio 24h antes
- Cancelacion
- Reagendamiento

## Roadmap por bloques

### Bloque 1 - Crear PROGRESO.md
Terminado hoy

### Bloque 2 - Setup del proyecto
- npx create-next-app
- Instalar dependencias
- Configurar .env con Neon
- Configurar tsconfig, next.config

### Bloque 3 - Schema Prisma inicial
- Tenant, TenantApp, User
- Specialty, Specialist
- Availability, Break, Block
- Slot, Appointment
- Migracion inicial

### Bloque 4 - Auth (NextAuth v5)
- Login con credentials
- Roles
- Registro publico -> paciente
- Registro de institucion (signup)

### Bloque 5 - Admin basico
- Layout del admin
- Dashboard
- CRUD Especialidades
- CRUD Especialistas

### Bloque 6 - Configuracion de horarios
- Vista por especialista
- Dias que atiende
- Duracion de consulta
- Colacion
- Anticipaciones

### Bloque 7 - Generacion de slots
- Generador de slots de los proximos N dias
- Actualizacion cuando cambia la disponibilidad

### Bloque 8 - Vista publica de reserva
- Home institucion
- Selector de especialidad
- Selector de especialista
- Calendario + slots (FullCalendar)
- Formulario de reserva
- Confirmacion

### Bloque 9 - Panel del especialista
- Ver agenda
- Marcar atendidas / no-show
- Bloquear dias / horas

### Bloque 10 - Emails (Resend)
- Confirmacion
- Recordatorio 24h
- Cancelacion
- Reagendamiento

### Bloque 11 - Multi-tenant
- Subdominios
- Middleware
- Branding por tenant
- Panel superadmin

### Bloque 12 - Fase Clinica
- Ficha del paciente
- Historia clinica
- Tratamientos
- Recetas
- Estadisticas

## Estado actual
Fecha: 2026-10-12
Estado: Iniciando proyecto

### Hecho
- Definiciones y diseno conceptual
- Este PROGRESO.md

### Pendiente
- Bloque 2: setup del proyecto

## Comandos utiles
- npm run dev
- npx prisma studio
- npx prisma migrate dev
- npx prisma generate
- git add -A ; git commit -m "..." ; git push origin main

## Cuentas (por crear)
- Repo GitHub
- Proyecto Neon
- Proyecto Vercel
- Cuenta Resend

## Decisiones tomadas
1. Multi-tenant desde el dia 1 (siempre, en todos los sistemas 8qlick)
2. Tenant = Institucion (cada cliente es 1 institucion)
3. Cada sistema tiene su propia BD en Neon
4. Carpeta del proyecto: C:\proyectos\8Agenda
5. Nombre: 8Agenda
6. Especialistas con horarios configurables (duracion en minutos)
7. Dias sin atencion se muestran como "Sin atencion"
8. Bloqueos: si
9. Ficha medica: paciente crea minimo, especialista completa
10. Emails: si, desde el inicio (Resend)
11. UI de agenda: FullCalendar
12. Pacientes reservan como invitados (sin login obligatorio)
## Progreso 2026-10-13
- Proyecto Next.js creado en C:\proyectos\8Agenda
- Dependencias instaladas: prisma, next-auth, fullcalendar, resend, bcryptjs, zod
- Neon: proyecto "8Agenda" creado (ep-noisy-bread-b5dljzgg)
- .env configurado con DATABASE_URL, DIRECT_URL, NEXTAUTH_*
- Prisma 8 configurado (arquitectura nueva con contract.prisma + contract.json)
- Contract emitido correctamente
- BD creada: 9 tablas (Tenant, User, Specialty, Specialist, Availability,
  Break, Block, Slot, Appointment, Patient)

### Notas tecnicas Prisma 8
- Schema se llama "contract.prisma" (no "schema.prisma")
- Sintaxis: "temporal.updatedAt()" en vez de "@updatedAt" o "DateTime @default(now()) @updatedAt"
- Sintaxis: "cuid(2)" en vez de "cuid()"
- Sintaxis: "json`{}`" en vez de "Json @default(\"{}\")"
- Comandos:
  - npx prisma contract emit  (antes: prisma generate)
  - npx prisma db init         (antes: prisma migrate dev, primera vez)
  - npx prisma migration plan  (planear migracion)
  - npx prisma db migrate      (aplicar migracion)
  - npx prisma migration status (ver estado)

### Pendiente siguiente
- Bloque 4: Auth (NextAuth v5) + roles

## Progreso 2026-10-13
- Proyecto Next.js creado en C:\proyectos\8Agenda
- Dependencias instaladas: prisma, next-auth, fullcalendar, resend, bcryptjs, zod
- Neon: proyecto "8Agenda" creado (ep-noisy-bread-b5dljzgg)
- .env configurado con DATABASE_URL, DIRECT_URL, NEXTAUTH_*
- Prisma 8 configurado (arquitectura nueva con contract.prisma + contract.json)
- Contract emitido correctamente
- BD creada: 9 tablas (Tenant, User, Specialty, Specialist, Availability,
  Break, Block, Slot, Appointment, Patient)

### Notas tecnicas Prisma 8
- Schema se llama "contract.prisma" (no "schema.prisma")
- Sintaxis: "temporal.updatedAt()" en vez de "@updatedAt" o "DateTime @default(now()) @updatedAt"
- Sintaxis: "cuid(2)" en vez de "cuid()"
- Sintaxis: "json`{}`" en vez de "Json @default(\"{}\")"
- Comandos:
  - npx prisma contract emit  (antes: prisma generate)
  - npx prisma db init         (antes: prisma migrate dev, primera vez)
  - npx prisma migration plan  (planear migracion)
  - npx prisma db migrate      (aplicar migracion)
  - npx prisma migration status (ver estado)

### Pendiente siguiente
- Bloque 4: Auth (NextAuth v5) + roles

## Progreso 2026-10-13 (tarde)
- Auth funcionando (login + register + roles)
- Panel admin con boton volver automatico
- CRUD Especialidades completo (crear, editar inline, orden, activa, eliminar)
- CRUD Especialistas completo (crear, editar duracion, activar, eliminar)
- Marcado cesar@8doce.cl como SUPERADMIN
- Pendiente: horarios por especialista, generacion de slots, agenda visual, vista publica de reserva, emails

## Progreso 2026-10-13
Fecha: 2026-10-13

### Estado del proyecto 8Agenda
- Proyecto Next.js creado en C:\proyectos\8Agenda
- Prisma 7.10.0 configurado (misma version que 8Doce y Retrolog)
- Base de datos en Neon (proyecto 8Agenda, ep-noisy-bread-b5dljzgg)
- .env configurado con DATABASE_URL, DIRECT_URL, NEXTAUTH_*
- next.config.ts sin cacheComponents (para que funcione auth())
- 9 tablas en Neon: Tenant, User, Specialty, Specialist, Availability, Break, Block, Slot, Appointment, Patient

### Auth
- NextAuth v5 con credentials
- Roles: SUPERADMIN, OWNER, ADMIN, SPECIALIST, RECEPTIONIST, PATIENT
- Login /login, registro /register
- lib/auth.ts + lib/auth-helpers.ts
- Usuario SUPERADMIN: cesar@8doce.cl

### Admin
- /admin con panel de tarjetas
- Boton "Volver al panel" automatico en todas las subpaginas
- /admin/especialidades: CRUD completo (crear, editar inline, orden, activa, eliminar)
- /admin/especialistas: CRUD completo (crear, editar duracion, activar, eliminar)

### Especialidades creadas (prueba)
- Cardiologia (verde)
- Medicina Interna (rojo)
- Pediatria (amarillo)
- Dermatologia (azul)

### API
- /api/auth/[...nextauth]
- /api/auth/register
- /api/admin/especialidades (GET, POST)
- /api/admin/especialidades/[id] (PATCH, DELETE)
- /api/admin/especialistas (GET, POST)
- /api/admin/especialistas/[id] (PATCH, DELETE)

### LECCION APRENDIDA: Prisma 8 rompe la estructura
NO USAR PRISMA 8 (release candidate). Usar Prisma 7.10.0 como en 8Doce y Retrolog.
- Prisma 8 usa contract.prisma (no schema.prisma)
- Prisma 8 usa @prisma/orm-postgres (no @prisma/client)
- Prisma 8 usa sintaxis diferente (temporal.updatedAt(), cuid(2), json`{}`)
- Prisma 8 requiere prisma.config.ts distinto
- Si toca usar Prisma 8, ver notas anteriores en este mismo archivo

### Pendiente siguiente
- Horarios por especialista (dias que atiende, horario, colacion)
- Generacion de slots (libres/tomados)
- Vista publica de reserva con calendario
- Agenda visual (semana, por especialista)
- Panel del especialista
- Emails (Resend) de confirmacion
- Multi-tenant completo (subdominios)
- Deploy a Vercel

## Progreso 2026-10-14
- Modelo SpecialistDay creado (calendario mensual)
- Panel de calendario por especialista (/admin/especialistas/[id]/dias)
  - Generar mes con patron (dias de atencion + horario + colacion)
  - Click en dia para activar/desactivar
  - Doble click para editar horario de un dia especifico
  - Guardar cambios
- Generacion de slots (/api/admin/especialistas/[id]/generar-slots)
  - Toma los dias activos y crea slots de X minutos
  - Respeta colacion
  - Regenera (borra y crea) cada vez que se aprieta
- Vista publica de reserva (/reservar)
  - Selector de especialista
  - Selector de dia (solo dias con slots libres)
  - Selector de hora
  - Formulario de datos del paciente
  - Confirmacion

### Pendiente siguiente
- Emails (Resend) de confirmacion
- Panel del especialista (ver sus citas)
- Panel admin de citas (/admin/citas)
- Vista semanal tipo Google Calendar
- Multi-tenant completo (subdominios)
- Deploy a Vercel

## Progreso 2026-10-14 (tarde) - Anulacion de reservas

### Schema
- Appointment: agregados campos `cancelToken String? @unique` y `cancelTokenExpira DateTime?`
- `npx prisma db push` aplicado
- `npx prisma generate` aplicado (importante: db push NO regenera el cliente)

### Emails (Resend) - estructura lista, falta API key
- `lib/emails.ts` creado con 2 funciones:
  - `enviarConfirmacionReserva()` -> email al paciente con link de anulacion
  - `enviarCancelacionReserva()` -> email confirmando anulacion
- Si `RESEND_API_KEY` esta vacia, NO envia email y loguea en consola
- FROM provisional: "8Agenda <onboarding@resend.dev>"
- Link de anulacion: `${NEXTAUTH_URL}/anular/${cancelToken}`
- Token: UUID sin guiones, expira en 7 dias

### API
- `POST /api/publico/reservar` -> actualizado: genera cancelToken + manda email confirmacion
- `GET /api/publico/anular/[token]` -> devuelve datos de la reserva (para pagina de confirmacion)
- `POST /api/publico/anular/[token]` -> anula (Appointment=CANCELADA, Slot=LIBRE) + manda email
- `POST /api/admin/citas/[id]/anular` -> anula desde admin (requiere rol ADMIN+)

### Paginas
- `app/anular/[token]/page.tsx` -> opcion B: muestra datos + boton "Confirmar anulacion"
- `app/anular/[token]/confirmado/page.tsx` -> check verde "Reserva anulada"
- `app/admin/citas/page.tsx` -> tabla con tabs de estado (activas/atendidas/canceladas/no-show/todas)
  - Filtro por especialidad
  - Boton "Anular" inline con confirmacion (sin modal)
- `app/admin/citas/BotonAnularCita.tsx` -> cliente, confirmacion inline

### Decisiones tomadas
- Anulacion: OPCION B (pagina de confirmacion, 2 clicks). Evita anulaciones accidentales.
- Quien puede anular: paciente (link email), admin/secretaria (desde /admin/citas), especialista (futuro panel)
- Token expira a los 7 dias
- Multi-tenant: el cancelToken es global unico (no por tenant)

### Pendiente siguiente
- Poner RESEND_API_KEY real cuando haya cuenta
- Reemplazar FROM "onboarding@resend.dev" por dominio propio verificado
- Panel del especialista (ver sus citas, marcar atendida/no-show)
- Recordatorio 24h antes (cron + Resend)
- Multi-tenant completo (subdominios)
- Deploy a Vercel
