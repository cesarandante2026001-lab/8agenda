# 8Agenda - Sistema de Agendamiento (Progreso)

## Estado actual (2026-10-16)

### Funcionando
- Auth con roles (SUPERADMIN, OWNER, ADMIN, RECEPTIONIST, SPECIALIST, PATIENT)
- Multi-tenant completo: filtros por tenantId en todas las APIs y paginas admin
- Superadmin ve todo, usuarios normales solo su institucion
- Endpoint /api/publico/crear-tenant (para que 8qlick cree instituciones)
- Endpoint /api/publico/reenviar-credenciales
- Admin: especialidades, especialistas (con credenciales), horarios, dias, citas, agenda semanal, pacientes, atenciones, usuarios
- Vista publica /reservar + /anular/[token]
- Reserva: dropdowns escalables, genera cancelToken, email confirmacion
- Recordatorio 24h: /api/cron/recordatorios + vercel.json
- Panel doctor /especialista: filtra sus citas, marcar atendida/no-show
- Atencion medica con recetas + examenes + vista imprimible + email al paciente

### Problemas pendientes (CRITICO)
1. **Login roto despues de multi-tenant**: el usuario existe, la contrasena coincide, pero NextAuth no crea la sesion
   - Probado: signIn client (falla), signIn server action (redirige a /ir pero /ir no existe)
   - Estado: /ir fue recien recreado, FALTA PROBAR
   - La home redirige a /admin si el rol es staff, /admin redirige a /login sin sesion -> loop
   - Hipotesis: probablemente el problema esta en que signIn del server action no propaga el tenantId en el token, o en el manejo del callbackUrl

2. **Bug boton "Generar slots"**: no muestra progreso ni mensaje de terminado

3. **Bug "Ver sitio publico"**: apuntaba a /admin/... en lugar de /t/[slug]

4. **Bug "Volver al inicio" en login/register**: generaba loop

5. **Falta integracion con 8qlick**: agregar 8Agenda como "DISPONIBLE" con boton "Ver demo" apuntando a la URL de Vercel

### Datos de prueba (actual)
- Tenant Clinica Norte (slug: clinica-norte) - asistente.norte@8agenda.cl / 12345678
- Tenant Centro Medico Sur (slug: centro-medico-sur) - asistente.sur@8agenda.cl / 12345678
- Tenant Clinica de Prueba (slug: clinica-prueba) - cesarandante2026001@gmail.com (owner)
- Paciente global: paciente.demo@8agenda.cl / 12345678
- Admin principal: cesarandante2026001@gmail.com

## Regla global de la suite 8qlick (agregada 2026-10-16)

### Multi-tenant primero, siempre
En TODOS los proyectos de la suite (8Agenda, 8Doce, Retrolog, y los que vengan):
- El modelo multi-tenant se implementa ANTES de cualquier feature
- El filtro por tenantId va desde el primer endpoint y la primera pagina
- NUNCA se hace "primero la feature, despues adaptamos a tenant"
- Todo test de funcionalidad se hace con 2 tenants distintos, no con 1

## Proxima sesion (prioridad)
1. **Resolver el login** - es lo unico que bloquea todo lo demas
2. Verificar que la redireccion por rol funcione (staff -> /admin, doctor -> /especialista, resto -> /)
3. Probar el flujo completo con 2 tenants:
   - Crear especialidad en Clinica Norte
   - Crear doctor en Clinica Norte
   - Generar slots
   - Reservar 1 hora con el mismo paciente en cada institucion
   - Verificar que no se mezclan
4. Bug "Generar slots" (barra de progreso)
5. Bug "Ver sitio publico" en admin
6. Integrar 8Agenda en pagina 8qlick
7. Deploy a Vercel

## Deuda tecnica
- middleware.ts deprecado (Next pide proxy.ts)
- Prisma 7.10.0 (no subir a 8)
- Despues de db push, correr prisma generate

## Comandos utiles
- npm run dev
- npx prisma studio
- npx prisma db push
- npx prisma generate
- git add -A ; git commit -m "..." ; git push origin master