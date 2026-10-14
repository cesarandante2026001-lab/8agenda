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

## Estado actual (2026-10-14)

### Funcionando
- Auth con roles (login + register)
- Admin: especialidades, especialistas, horarios, dias, citas
- Vista publica de reserva /reservar con dropdowns (escala a 200 especialidades)
- Anulacion de reservas:
  - Paciente por email (link /anular/[token])
  - Admin desde /admin/citas (boton inline)
  - Pagina de confirmacion (opcion B)
- /admin/agenda: vista semanal, click en cita abre detalle, boton +Nueva cita
- /admin/agenda/nueva: crear cita manual (para secretaria)
- /admin/agenda/[id]: detalle de cita con boton anular
- /especialista: admin ve todas las citas, marcar atendida/no-show
- /especialista/hoy: solo las citas del dia
- Recordatorio 24h: endpoint /api/cron/recordatorios + vercel.json (corre 12:00 UTC)

### Pendientes
- Poner RESEND_API_KEY real (cuenta Resend)
- Reemplazar FROM "onboarding@resend.dev" por dominio verificado
- Panel del especialista con login propio (opcion B, cuando se necesite)
- Multi-tenant completo (subdominios, middleware, branding)
- Deploy a Vercel
- Fase clinica (ficha medica, historia, tratamientos)

### Probar recordatorio manualmente
Abrir en el navegador (dev server corriendo):
  http://localhost:3000/api/cron/recordatorios?secret=cron_74fb6d40b8ab4215b7c1fb6983c03022

Devuelve JSON con total, enviados, errores.
Si RESEND_API_KEY esta vacia, no envia pero cuenta.

## Modelo de datos
- Tenant, User (roles: SUPERADMIN, OWNER, ADMIN, SPECIALIST, RECEPTIONIST, PATIENT)
- Specialty, Specialist
- Availability, Break, Block
- Slot (LIBRE, TOMADO, BLOQUEADO)
- Appointment (RESERVADA, CONFIRMADA, ATENDIDA, CANCELADA, NO_SHOW)
  - cancelToken (unico, expira en 7 dias)
- Patient (ficha medica en fase 2)
- SpecialistDay (calendario mensual por especialista)

## Rutas principales
- /                          Home publico (boton Reservar)
- /reservar                  Reserva publica (dropdowns)
- /login, /register          Auth
- /admin                     Panel admin
- /admin/especialidades      CRUD
- /admin/especialistas       CRUD + horarios + dias
- /admin/citas               Lista con filtros + anular
- /admin/agenda              Vista semanal
- /admin/agenda/nueva        Crear cita manual
- /admin/agenda/[id]         Detalle de cita
- /especialista              Panel especialista (admin ve todas)
- /especialista/hoy          Citas de hoy
- /anular/[token]            Confirmar anulacion
- /anular/[token]/confirmado OK anulada

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
6. Especialistas con horarios configurables (duracion en minutos)
7. Dias sin atencion se muestran como "Sin atencion"
8. Ficha medica: paciente crea minimo, especialista completa (fase 2)
9. Pacientes reservan como invitados (sin login obligatorio)
10. Anulacion: opcion B (pagina de confirmacion, 2 clicks)
11. cancelToken expira a los 7 dias
12. Panel especialista: opcion A (admin ve todas), login propio queda para despues
13. Recordatorio 24h: Vercel Cron (12:00 UTC) + endpoint manual con secret

## Notas tecnicas
- Prisma 7.10.0 (NO usar Prisma 8)
- Despues de db push, correr siempre npx prisma generate
- Git: branch es "master", remote origin = https://github.com/cesarandante2026001-lab/8agenda.git
- PowerShell: NO usar $home como variable (es reservada)
- El CRON_SECRET esta en .env (NO commitear .env)
- .env no esta en el repo (esta en .gitignore)

## Comandos utiles
- npm run dev
- npx prisma studio
- npx prisma db push
- npx prisma generate
- git add -A ; git commit -m "..." ; git push origin master

## Cuentas
- GitHub: https://github.com/cesarandante2026001-lab/8agenda
- Neon: proyecto 8Agenda
- Resend: pendiente (falta API key)
- Vercel: pendiente