# 8Agenda - Sistema de Agendamiento (Progreso)

## Proyecto
Sistema de agendamiento multi-tenant para instituciones que necesitan gestionar
horas medicas y reservas. Forma parte de la suite 8qlick.

## Stack
- Next.js 16 (App Router, Turbopack) + TypeScript
- Prisma 7.10.0 + PostgreSQL (Neon)
- NextAuth v5 (credentials)
- Tailwind CSS
- Resend (emails transaccionales)
- Vercel (hosting + deploy + cron)

## Estado actual (2026-10-15)

### Funcionando
- Auth con roles (login + register)
- Login redirige segun rol (admin -> /admin, doctor -> /especialista)
- Admin: especialidades, especialistas, horarios, dias, citas
- Vista publica de reserva /reservar con dropdowns (escala a 200)
- Anulacion de reservas (paciente por email, admin desde /admin/citas)
- /admin/agenda: vista semanal, detalle de cita, +Nueva cita manual
- /admin/citas: tabla con tabs, filtro por especialidad
- /admin/pacientes: lista con buscador + crear manual
- /admin/pacientes/[id]: ficha completa editable (datos personales + medicos)
- /especialista: filtros Todas/Activas/Atendidas/No-show, muestra solo las del doctor
- /especialista/hoy: solo citas del dia del doctor
- /especialista/citas/[id]/atender: formulario clinico (motivo, signos, examen, diagnostico, indicaciones, recetas, examenes)
- Recordatorio 24h: endpoint /api/cron/recordatorios + vercel.json
- Multi-tenant base: subdominios (demo.localhost) + /t/[slug]
- Crear especialista crea User con rol SPECIALIST + contrasena temporal
- Reset de contrasena desde /admin/especialistas
- Cambio de contrasena propio en /cuenta/password

### Bugs conocidos
1. Datos cruzados en citas viejas: patientName dice un nombre pero patientId apunta a otro paciente
   (producto de la migracion masiva). Arreglar con script.
2. Link "Admin" aparece en el menu del doctor (no deberia)
3. Aviso: middleware.ts deprecado, Next pide migrar a proxy.ts (funciona igual)

### Pendientes inmediatos
1. Arreglar datos cruzados de pacientes en citas viejas
2. Ocultar link "Admin" en el menu del doctor
3. Vista imprimible de la atencion (/atenciones/[id]/imprimir)
4. Enviar atencion por email al paciente (Resend)
5. Multi-tenant fase 2: filtrar todo por tenant
6. Deploy a Vercel

### Pendientes secundarios
- Dashboard con KPIs (citas del mes, no-show, top especialistas)
- Branding por tenant (logo, colores)
- Panel de asistente/recepcionista con permisos especificos
- Editar/reprogramar cita existente

### Notas sobre Resend
- Cuenta gratuita: solo envia al correo de registro (cesarandante2026001@gmail.com)
- Para enviar a otros correos: verificar dominio en resend.com/domains
- Cuando se verifique: cambiar FROM en lib/emails.ts (hoy "onboarding@resend.dev")

## Modelo de datos
- Tenant (slug, name, branding, plan)
- User (roles: SUPERADMIN, OWNER, ADMIN, SPECIALIST, RECEPTIONIST, PATIENT)
- Specialty (por tenant)
- Specialist (por tenant + specialty) con userId -> User (1-a-1)
- Availability, Break, Block
- Slot (LIBRE, TOMADO, BLOQUEADO)
- Appointment (RESERVADA, CONFIRMADA, EN_SALA, ATENDIDA, CANCELADA, NO_SHOW)
  con cancelToken unico (expira 7 dias)
- Patient (ficha completa: datos personales + prevision + contacto emergencia + ficha medica)
- SpecialistDay (calendario mensual)
- Atencion (1-a-1 con Appointment): motivo, anamnesis, examen fisico, diagnostico, indicaciones, signos vitales
- Receta (1-a-muchos con Atencion): medicamento, dosis, frecuencia, duracion, indicaciones
- SolicitudExamen (1-a-muchos con Atencion): nombre, notas

## Rutas
- /                            Home publico (redirige por rol si logueado)
- /reservar                    Reserva publica
- /login, /register            Auth
- /cuenta/password             Cambiar contrasena propia
- /admin                       Panel admin
- /admin/especialidades        CRUD
- /admin/especialistas         CRUD + credenciales + reset pass
- /admin/especialistas/[id]/dias     Calendario mensual
- /admin/especialistas/[id]/horarios Horarios por dia
- /admin/citas                 Lista con filtros + anular
- /admin/agenda                Vista semanal
- /admin/agenda/nueva          Crear cita manual
- /admin/agenda/[id]           Detalle de cita
- /admin/pacientes             Lista con buscador
- /admin/pacientes/nuevo       Crear paciente
- /admin/pacientes/[id]        Ficha completa editable + historial de atenciones
- /especialista                Panel doctor (filtros por estado)
- /especialista/hoy            Citas de hoy del doctor
- /especialista/citas/[id]/atender  Formulario clinico
- /anular/[token]              Confirmar anulacion
- /anular/[token]/confirmado   OK anulada
- /t/[slug]                    Home del tenant

## API
- /api/auth/[...nextauth]
- /api/auth/register
- /api/auth/redirect (redirige segun rol)
- /api/cuenta/password (POST)
- /api/admin/especialidades (GET, POST)
- /api/admin/especialidades/[id] (PATCH, DELETE)
- /api/admin/especialistas (GET, POST)
- /api/admin/especialistas/[id] (PATCH, DELETE)
- /api/admin/usuarios/[id]/reset-password (POST)
- /api/admin/citas/crear (POST)
- /api/admin/citas/[id]/anular (POST)
- /api/admin/slots-libres (GET)
- /api/admin/pacientes (POST)
- /api/admin/pacientes/[id] (PATCH)
- /api/publico/especialistas
- /api/publico/especialistas/[id]/disponibilidad
- /api/publico/reservar (genera cancelToken + email)
- /api/publico/anular/[token] (GET, POST)
- /api/especialista/citas/[id]/marcar (POST)
- /api/especialista/citas/[id]/atencion (POST)
- /api/cron/recordatorios (GET con secret)

## Decisiones tomadas
1. Multi-tenant desde el dia 1
2. Tenant = Institucion
3. Cada sistema tiene su propia BD en Neon
4. Carpeta: C:\proyectos\8Agenda
5. Nombre: 8Agenda
6. Especialistas con horarios configurables
7. Dias sin atencion se muestran como "Sin atencion"
8. Ficha medica: paciente crea minimo, doctor completa
9. Pacientes reservan como invitados (sin login obligatorio)
10. Anulacion: opcion B (pagina de confirmacion, 2 clicks)
11. cancelToken expira a los 7 dias
12. Doctor tiene login propio (User con rol SPECIALIST) vinculado por userId
13. Doctor ve SOLO sus citas. Admin/Asistentes ven todas
14. Doctor NO reprograma: solicita bloqueo, admin/asistente gestiona
15. Contrasena temporal autogenerada, admin entrega al doctor
16. Al marcar ATENDIDA la cita no desaparece: queda en gris (opcion B)
17. Recordatorio 24h: Vercel Cron (12:00 UTC) + endpoint manual con secret
18. Atencion medica se guarda 1-a-1 con la cita

## Notas tecnicas importantes
- Prisma 7.10.0 (NO usar Prisma 8)
- Despues de db push, correr SIEMPRE npx prisma generate
- Scripts .mjs standalone necesitan driver adapter (@prisma/adapter-pg)
- Git branch: "master"
- Remote: https://github.com/cesarandante2026001-lab/8agenda.git
- PowerShell: NO usar $home como variable (es reservada)
- .env no esta en el repo
- CRON_SECRET esta en .env

## Correos de prueba
- Admin/registro Resend: cesarandante2026001@gmail.com
- Paciente de prueba: ccousino@gmail.com
- Especialistas de prueba: carcou2017+vp1f@gmail.com, carcou2017+wbw9@gmail.com, carcou2017+rrev@gmail.com

## Scripts utilitarios (raiz del proyecto)
- crear-tenant.mjs             crear tenant de prueba
- restaurar-correos.mjs        restaurar correos de pacientes y especialistas
- migrar-especialistas-a-users.mjs  crear User para cada Specialist sin user
- migrar-citas-a-pacientes.mjs      vincular citas viejas a su Patient
- crear-citas-prueba.mjs       crear 20 citas con pacientes ficticios
- check-id.mjs                 verificar una cita y su atencion por id

## Comandos utiles
- npm run dev
- npx prisma studio
- npx prisma db push
- npx prisma generate
- git add -A ; git commit -m "..." ; git push origin master

## Proxima sesion
1. Arreglar datos cruzados de pacientes
2. Ocultar "Admin" del menu del doctor
3. Vista imprimible de atencion
4. Email de atencion al paciente
5. Multi-tenant fase 2
6. Deploy a Vercel
## Anexo 2026-10-16 - Tareas para otros sistemas (anotadas)

### 8qlick (pagina corporativa)
- Integrar 8Agenda en la seccion "Sistemas" con boton "Ver demo"
  que apunte a la URL publica de 8Agenda en Vercel.
- Hoy 8Agenda aparece como "PROXIMAMENTE". Cambiar a "DISPONIBLE"
  cuando este deployado.
- Sistema 8qlick esta en https://8doce.vercel.app/8qlick

### 8Doce (ecommerce de ropa)
- Pendiente revisar cuando terminemos 8Agenda.

### Retrolog (por definir)
- Pendiente revisar cuando terminemos 8Agenda.

## Anexo 2026-10-16 - Tareas para otros sistemas (anotadas)

### 8qlick (pagina corporativa)
- Integrar 8Agenda en la seccion "Sistemas" con boton "Ver demo"
  que apunte a la URL publica de 8Agenda en Vercel.
- Hoy 8Agenda aparece como "PROXIMAMENTE". Cambiar a "DISPONIBLE"
  cuando este deployado.
- Sistema 8qlick esta en https://8doce.vercel.app/8qlick

### 8Doce (ecommerce de ropa)
- Pendiente revisar cuando terminemos 8Agenda.

### Retrolog (por definir)
- Pendiente revisar cuando terminemos 8Agenda.

## Flujo multi-tenant (8qlick -> 8Agenda)

1. Alguien contrata el sistema Agenda desde 8qlick.
2. 8qlick cobra y, si el pago es exitoso, llama al endpoint de 8Agenda:
   POST /api/publico/crear-tenant
   Header: x-api-key: <API_KEY_8QLICK>
   Body: { slug, name, plan, ownerEmail, ownerName, ... }
3. 8Agenda crea el Tenant + User OWNER con contrasena temporal autogenerada.
   Devuelve el tenant + las credenciales temporales en el JSON.
4. 8qlick muestra las credenciales en pantalla y manda el email al owner
   (el email tambien lo manda 8Agenda automaticamente).
5. El owner entra a /login con su email y contrasena temporal.
6. Si las pierde, 8qlick puede llamar:
   POST /api/publico/reenviar-credenciales
   Header: x-api-key: <API_KEY_8QLICK>
   Body: { tenantSlug }
   -> genera nueva contrasena, invalida la anterior, reenvia email.

## Endpoints internos de 8Agenda para 8qlick
- POST /api/publico/crear-tenant
- POST /api/publico/reenviar-credenciales
Ambos requieren header X-API-Key con API_KEY_8QLICK.

## Variables de entorno
- API_KEY_8QLICK: secreto compartido entre 8qlick y 8Agenda.
- EMAIL_FROM: correo remitente (debe estar verificado en Resend).

## REGLA GLOBAL DE LA SUITE 8QLICK (agregada 2026-10-16)

### Multi-tenant primero, siempre
En TODOS los proyectos de la suite (8Agenda, 8Doce, Retrolog, y los que vengan):
- El modelo multi-tenant se implementa ANTES de cualquier feature.
- El filtro por tenantId va desde el primer endpoint y la primera pagina.
- NUNCA se hace "primero la feature, despues adaptamos a tenant".
- El script de migracion inicial crea al menos 1 tenant + 1 user OWNER.
- Todo test de funcionalidad se hace con 2 tenants distintos, no con 1.

### Por que
Readaptar 40 archivos despues es costoso, lento y genera errores en cascada.
Hacerlo desde el principio cuesta 10 minutos.

### Aplicacion
- 8Agenda: ya implementado (completo).
- 8Doce: revisar y aplicar la misma regla.
- Retrolog: revisar y aplicar la misma regla.
