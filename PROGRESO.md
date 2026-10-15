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
- Ficha del paciente expandida (campos medicos + lista + ficha editable + API)
- Home publico con menu, /login y /register con boton Volver

### Pendientes inmediatos
1. **Resend**: verificar dominio propio para enviar a cualquier correo
   - Hoy solo envia a cesarandante2026001@gmail.com (cuenta gratuita sin dominio)
   - Cuando se verifique dominio: cambiar FROM en lib/emails.ts
2. **Multi-tenant fase 2**: filtrar datos por tenant
   - Hoy /t/[slug] muestra especialidades de TODOS los tenants
   - Hay que filtrar Specialty, Specialist, Slot, Appointment por tenantId
3. **Deploy a Vercel**

---

## ANALISIS DEL SISTEMA CLINICO (arquitectura pensada desde los 5 roles)

### Rol 1 - Paciente
- Reserva hora sin login -> OK hoy
- Recibe email con confirmacion + link de anulacion -> OK hoy (falta dominio Resend)
- Llega al consultorio -> la asistente lo marca como "llego" (check-in) -> FALTA
- Despues de la consulta, ve que le recetaron -> FALTA (historial visible para paciente, fase 2)

### Rol 2 - Asistente / Recepcionista (el rol con mas carga)
- Ver la agenda del dia en formato calendario -> OK hoy (/admin/agenda)
- Marcar llegada del paciente -> FALTA
- Cobrar consulta / registrar pago -> FALTA
- Reagendar citas -> FALTA
- Llamar al paciente para recordatorio manual -> parcialmente (cron automatico)
- Crear paciente nuevo (llega por primera vez sin reservar) -> FALTA
- Ver lista de espera del dia -> FALTA

### Rol 3 - Doctor
- Ver SOLO sus citas del dia -> OK hoy pero muestra todas, falta filtrar por doctor
- Click en una cita -> ver ficha del paciente (solo lectura) -> FALTA
- Al terminar la consulta, escribir:
  - Motivo de consulta
  - Anamnesis
  - Examen fisico
  - Signos vitales (PA, FC, T, peso, talla, SatO2)
  - Diagnostico
  - Indicaciones / tratamiento
  - Solicitud de examenes
  - Receta
- Guardar como "Atencion" ligada al paciente -> FALTA TODO ESTO
- Historial del paciente (ver consultas anteriores) -> FALTA

### Rol 4 - Admin / Dueno
- Todo lo del asistente
- Configurar especialidades, especialistas, horarios -> OK hoy
- Ver KPIs: citas del mes, tasa no-show, ingresos, especialista top -> FALTA
- Crear nuevos usuarios (asistentes, doctores) -> parcialmente (crear especialista NO crea usuario todavia)

### Rol 5 - Junior / Programador
- Necesita modelo de datos limpio
- HOY Specialist NO esta vinculado a User -> hay que arreglarlo
- HOY Patient solo existe si alguien reservo por web -> hay que permitir crearlo desde admin
- HOY Appointment no tiene estado "en sala" ni "atendida" con hora real

---

## PROPUESTA DE EVOLUCION (5 bloques en orden)

### Bloque 1 - Vincular Specialist con User
- Agregar userId a Specialist (relacion 1-a-1 con User)
- Al crear especialista desde /admin/especialistas:
  - Crear User con rol SPECIALIST + email + contrasena temporal autogenerada
  - El admin ve la contrasena una vez en pantalla y se la pasa al doctor
- El doctor entra con su email -> cae a /especialista
- Ve SOLO sus citas (filtrando por su userId)
- Pantalla /especialista/perfil para editar sus datos
- Admin/asistentes siguen viendo todas las citas

### Bloque 2 - Flujo de agenda diaria (vista asistente)
- Estados de cita ampliados:
  RESERVADA -> CONFIRMADA (check-in) -> EN_SALA -> ATENDIDA / NO_SHOW
- En /admin/agenda cada cita se puede marcar: confirmada, en sala, atendida, no-show
- Vista del dia tipo "lista de espera" con orden por hora

### Bloque 3 - Consulta medica (corazon clinico)
- Nueva tabla Atencion ligada a Appointment + Patient + Specialist
- Campos: motivo, anamnesis, examen fisico, diagnostico, indicaciones, signos vitales
- Pantalla /especialista/citas/[id]/atender (el doctor la abre al terminar)
- Al guardar, Appointment.status = ATENDIDA automaticamente

### Bloque 4 - Recetas y solicitudes de examenes
- Nueva tabla Receta (medicamento, dosis, frecuencia, duracion) ligada a Atencion
- Nueva tabla SolicitudExamen (nombre, notas) ligada a Atencion
- Vista imprimible /admin/atenciones/[id]/imprimir
- Fase posterior: envio por email al paciente

### Bloque 5 - Historial clinico del paciente
- Vista /admin/pacientes/[id]/historial con timeline de atenciones
- Cada atencion desplegable: motivo, diagnostico, receta, examenes
- El doctor ve este historial desde su panel antes de atender

---

## DECISIONES PENDIENTES (antes de arrancar Bloque 1)

- D1) El asistente puede crear pacientes desde /admin/pacientes/nuevo? (recomendado SI)
- D2) Los estados nuevos de cita (CONFIRMADA, EN_SALA) se agregan ahora o despues? (recomendado AHORA)
- D3) La contrasena temporal del doctor se muestra al admin en pantalla o se envia por email? (recomendado PANTALLA)

---

## Modelo de datos actual
- Tenant
- User (SUPERADMIN, OWNER, ADMIN, SPECIALIST, RECEPTIONIST, PATIENT)
- Specialty, Specialist
- Availability, Break, Block
- Slot (LIBRE, TOMADO, BLOQUEADO)
- Appointment (RESERVADA, CONFIRMADA, ATENDIDA, CANCELADA, NO_SHOW)
  - cancelToken (unico, expira 7 dias)
- Patient (ficha basica + campos medicos expandidos 2026-10-15)
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
- /admin/pacientes             Lista con buscador
- /admin/pacientes/[id]        Ficha editable
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
- /api/admin/pacientes/[id]   (PATCH)
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
12. Panel especialista: admin ve todas; login propio se agrega en Bloque 1
13. Recordatorio 24h: Vercel Cron (12:00 UTC) + endpoint manual con secret
14. Doctor NO reprograma: solicita bloqueo, admin/asistente lo gestiona
15. Asistente/recepcionista maneja reprogramaciones y agenda
16. Doctor tendra login propio (email = User), ve solo sus citas
17. Contrasena temporal autogenerada que el admin entrega al doctor

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
- Resend en plan gratuito SOLO envia al correo de registro
- Para enviar a otros: verificar dominio en resend.com/domains y cambiar FROM en lib/emails.ts

## Comandos utiles
- npm run dev
- npx prisma studio
- npx prisma db push
- npx prisma generate
- node crear-tenant.mjs demo "Clinica Demo"
- node restaurar-correos.mjs
- git add -A ; git commit -m "..." ; git push origin master

## Proxima sesion
1. Confirmar D1, D2, D3
2. Arrancar Bloque 1 (vincular Specialist con User + login del doctor)
3. Seguir con Bloque 2 (estados de cita ampliados)
4. Bloque 3 (Atencion medica) - el corazon clinico
5. Bloque 4 (Recetas + examenes)
6. Bloque 5 (Historial del paciente)
7. Multi-tenant fase 2 cuando lo clinico este andando
8. Deploy a Vercel al final