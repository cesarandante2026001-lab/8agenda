# 8AGENDA - CONTEXTO Y REGLAS PARA EL ASISTENTE
# (Pegar este archivo al INICIO de cada conversacion)

===============================================================================
  SECCION 1: COMO TRABAJAMOS (reglas no negociables)
===============================================================================

## Regla 1: Diagnostico antes de tocar
NUNCA escribir codigo nuevo sin antes ver el estado real del archivo afectado.
Antes de modificar algo, pedir SIEMPRE el Get-Content del archivo.
No asumir el contenido. No improvisar.

## Regla 2: Un cambio a la vez, verificado
NO lanzar bloques gigantes de 40 archivos de una.
Hacer cambios en bloques chicos. Ejecutar. Verificar que funciona.
Recien ahi pasar al siguiente bloque.

## Regla 3: Multi-tenant PRIMERO siempre
En cualquier feature nueva, el filtro por tenantId va desde el minuto cero.
Nunca "primero la feature, despues adaptamos a multi-tenant".
Esta regla ya nos costo 2 dias de retrabajo. No se rompe mas.

## Regla 4: No inventar comandos
Antes de decir "ejecuta X", verificar que X existe.
Si no se esta seguro, primero listar archivos con Get-ChildItem.
No usar caracteres unicode (flechas, comillas curvas) que se rompen en PowerShell.

## Regla 5: No usar variables reservadas de PowerShell
- $home (apunta a C:\Users\<user>)
- $host
- $profile
- $error
Usar nombres propios: $paginaInicio, $contenidoHome, etc.

## Regla 6: Auth no se toca sin plan
El modulo de autenticacion (lib/auth.ts, app/login) es critico.
Antes de modificarlo, hacer diagnostico completo:
  - Get-Content de lib/auth.ts
  - Verificar que los usuarios existan en la BD
  - Verificar que las contrasenas matcheen (script de prueba)
  - Verificar el callback de jwt y session
Si algo falla, probar UNA hipotesis por vez. No cambiar 5 cosas juntas.

## Regla 7: Cuando algo se rompe, volver atras
Si un cambio rompe algo que funcionaba, la primera accion es REVERTIR.
No intentar arreglar arriba de un cambio roto.
git log para ver el ultimo commit bueno y volver a ese estado.

## Regla 8: Idioma
Espanol neutro. Sin modismos chilenos (weon, po, cachai, altiro).
Directo. Sin explicaciones de mas.

## Regla 9: Verificar antes de decir "listo"
Antes de decir "listo, ya esta", pedir confirmacion visual:
  - Captura de pantalla
  - Salida de consola
  - Resultado del navegador
No declarar victoria sin prueba.

## Regla 10: Si no se entiende, preguntar
Mejor preguntar "esto es lo que entendi, es correcto?"
que asumir mal y hacer perder tiempo.

===============================================================================
  SECCION 2: STACK Y ARQUITECTURA
===============================================================================

## Stack
- Next.js 16 App Router + Turbopack
- TypeScript
- Prisma 7.10.0 (NO SUBIR a Prisma 8: rompe todo)
- PostgreSQL en Neon
- NextAuth v5 (credentials + JWT)
- Tailwind CSS
- Resend (emails)
- Vercel (futuro deploy)

## Estructura de carpetas
C:\proyectos\8agenda\
  app\
    admin\           panel administracion
    especialista\    panel doctor
    reservar\        vista publica
    anular\[token]\  anulacion por email
    t\[slug]\        home del tenant (subdominio)
    api\
      admin\         endpoints admin (filtran por tenant)
      publico\       endpoints publicos
      especialista\  endpoints del doctor
      cron\          tareas programadas
      auth\          NextAuth
    login\
    register\
    cuenta\password\
  lib\
    auth.ts             configuracion NextAuth
    auth-helpers.ts     helpers admin
    auth-helpers-extra.ts  currentUser con tenantId
    tenant.ts           getUsuario, withTenant, etc
    prisma.ts           singleton
    emails.ts           envio con Resend
    generar-slots.ts    logica de slots
  prisma\
    schema.prisma       modelo de datos
  middleware.ts         detecta subdominio y reescribe
  types\next-auth.d.ts  tipado de session

## Modelo de datos (jerarquia)
Tenant (institucion)
  -> Specialty (especialidad)
    -> Specialist (doctor) + User vinculado por userId
      -> Slot (hora disponible) -> Appointment (reserva)
        -> Atencion (consulta medica)
          -> Receta
          -> SolicitudExamen
  -> Patient (paciente)
  -> User (todos los usuarios del tenant)

## Estados de cita
RESERVADA -> CONFIRMADA -> EN_SALA -> ATENDIDA
                                   -> NO_SHOW
                                   -> CANCELADA

## Roles
SUPERADMIN    ve todo (multi-tenant)
OWNER         dueno de la institucion
ADMIN         administrador de la institucion
RECEPTIONIST  asistente / secretaria
SPECIALIST    doctor (ve solo sus citas)
PATIENT       paciente (futuro)

## Multi-tenant (como funciona)
- Cada usuario pertenece a un tenantId (excepto SUPERADMIN)
- withTenant(u) devuelve {} para SUPERADMIN, {tenantId: "xxx"} para el resto
- Todas las queries de admin usan withTenant
- Vista publica: tenant se determina por subdominio o por /t/[slug]
- La institucion se crea desde 8qlick via POST /api/publico/crear-tenant

===============================================================================
  SECCION 3: ESTADO ACTUAL
===============================================================================

## Funciona
- Multi-tenant completo (filtrado por tenantId en todas las APIs admin)
- Vista publica /reservar con dropdowns escalables
- Anulacion de reservas por token
- Cron recordatorio 24h
- Panel admin completo (especialidades, especialistas, agenda, citas,
  pacientes, atenciones, usuarios)
- Panel doctor (filtra sus citas, marcar atendida/no-show)
- Formulario clinico con recetas y examenes
- Vista imprimible de atencion
- Endpoint crear-tenant para 8qlick

## Roto / pendiente (PRIORIDAD 1)
- LOGIN NO FUNCIONA: el usuario y contrasena existen y son validos,
  pero NextAuth no crea la sesion. SignIn devuelve error silencioso.
  El cliente redirige a /admin, /admin no ve sesion, redirige a /login,
  loop infinito.
  Ultimo intento: login con server action + redirectTo /ir.
  /ir fue borrada por error, hay que recrearla.

## Roto / pendiente (PRIORIDAD 2)
- Boton "Generar slots" no muestra progreso
- "Ver sitio publico" en admin apunta mal
- "Volver al inicio" en login/register puede generar loop

## Pendiente grande
- Integracion con 8qlick (agregar 8Agenda como DISPONIBLE con boton Ver demo)
- Deploy a Vercel
- Dashboard KPIs
- Branding por tenant

===============================================================================
  SECCION 4: DATOS DE PRUEBA
===============================================================================

## Tenants
- clinica-norte       (Clinica Norte)
- centro-medico-sur   (Centro Medico Sur)
- clinica-prueba      (Clinica de Prueba)
- principal           (Institucion Principal - datos viejos)

## Usuarios (password: 12345678)
- cesarandante2026001@gmail.com   OWNER de Clinica de Prueba + admin global
- asistente.norte@8agenda.cl      RECEPTIONIST de Clinica Norte
- asistente.sur@8agenda.cl        RECEPTIONIST de Centro Medico Sur
- paciente.demo@8agenda.cl        PATIENT (no se usa para login)

## Correos (Resend)
- Registro Resend: cesarandante2026001@gmail.com
- Plan gratuito: solo envia a ese correo
- Para enviar a otros: verificar dominio en resend.com/domains

===============================================================================
  SECCION 5: COMANDOS Y CONVENCIONES
===============================================================================

## Comandos utiles
- npm run dev                              arranca server
- npx prisma studio                        ver la BD
- npx prisma db push                       aplicar schema
- npx prisma generate                      regenerar cliente (despues de db push)
- git add -A ; git commit -m "..." ; git push origin master
- Ctrl+C en terminal para matar server

## Como se escriben los archivos (para evitar BOM)
[System.IO.File]::WriteAllText("$PWD\ruta\archivo.tsx", $contenido, [System.Text.UTF8Encoding]::new($false))

## Si el server queda colgado
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
npm run dev

## Git
- Branch: master
- Remote: https://github.com/cesarandante2026001-lab/8agenda.git
- .env NO esta en el repo (esta en .gitignore)

===============================================================================
  SECCION 6: COMO REPORTAR UN BUG O PEDIR UN CAMBIO
===============================================================================

Formato que funciona:
1. Que estabas haciendo (ej: "estaba creando un especialista")
2. Que esperabas (ej: "deberia aparecer en la lista")
3. Que paso (ej: "dice Error al crear")
4. Captura o texto del error

Con eso el asistente diagnostica sin adivinar.

===============================================================================
  SECCION 7: PROXIMO PASO
===============================================================================

Cuando se retome el trabajo, empezar por:
1. Arreglar el login (unica cosa rota critica)
2. Recien despues el resto

===============================================================================