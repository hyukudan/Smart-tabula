# Smart Tabula

Sistema inteligente de gestión de menús y pedidos de comida para empresas.

## Características

- **Gestión de menús**: Crea y publica menús diarios/semanales
- **Sistema de pedidos**: Los empleados pueden hacer sus pedidos diarios
- **Gestión de alergias**: Registro de alergias con alertas automáticas
- **Preferencias alimentarias**: Vegetariano, vegano, sin gluten, etc.
- **Calendario de ausencias**: Vacaciones, teletrabajo, etc.
- **"Hoy no como"**: Días específicos sin usar el comedor
- **Notificaciones**: Avisos automáticos de nuevos menús
- **Dashboard de administración**: Estadísticas y gestión completa
- **API REST**: Para integraciones con CRM/ERP externos
- **100% Local**: Todo en Docker, sin dependencias cloud

## Stack Tecnológico

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: shadcn/ui, Radix UI, Tailwind CSS
- **Base de datos**: SQLite con Prisma ORM
- **Autenticación**: NextAuth.js
- **Contenedorización**: Docker + Docker Compose

## Instalación

### Desarrollo local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/smart-tabula.git
cd smart-tabula

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Inicializar base de datos
npm run db:push
npm run db:seed

# Iniciar en modo desarrollo
npm run dev
```

### Docker (Producción)

```bash
# Construir y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

## Credenciales por defecto

Después de ejecutar `npm run db:seed`:

- **Admin**: admin@smarttabula.com / admin123

## Estructura del Proyecto

```
smart-tabula/
├── prisma/
│   ├── schema.prisma     # Esquema de base de datos
│   └── seed.ts           # Datos iniciales
├── src/
│   ├── app/
│   │   ├── api/          # API Routes
│   │   ├── admin/        # Panel de administración
│   │   ├── dashboard/    # Dashboard empleados
│   │   ├── menu/         # Menú del día
│   │   ├── orders/       # Mis pedidos
│   │   ├── absences/     # Gestión de ausencias
│   │   ├── notifications/# Notificaciones
│   │   └── profile/      # Perfil de usuario
│   ├── components/
│   │   ├── layout/       # Componentes de layout
│   │   └── ui/           # Componentes shadcn/ui
│   ├── lib/
│   │   ├── auth/         # Configuración NextAuth
│   │   ├── prisma.ts     # Cliente Prisma
│   │   └── utils.ts      # Utilidades
│   └── types/            # Tipos TypeScript
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## API REST

### Endpoints públicos (requieren autenticación)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/menus | Listar menús |
| GET | /api/menus/:id | Obtener menú |
| GET | /api/dishes | Listar platos |
| GET | /api/orders | Mis pedidos |
| POST | /api/orders | Crear pedido |
| PUT | /api/orders | Actualizar pedido |
| GET | /api/users/profile | Mi perfil |
| PUT | /api/users/profile | Actualizar perfil |
| GET | /api/absences | Mis ausencias |
| POST | /api/absences | Crear ausencia |
| GET | /api/notifications | Mis notificaciones |
| GET | /api/health | Health check |

### Endpoints de administrador

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/menus | Crear menú |
| PUT | /api/menus/:id | Actualizar menú |
| DELETE | /api/menus/:id | Eliminar menú |
| POST | /api/menus/:id/publish | Publicar menú |
| POST | /api/dishes | Crear plato |
| PUT | /api/dishes/:id | Actualizar plato |
| DELETE | /api/dishes/:id | Eliminar plato |
| POST | /api/allergies | Crear alérgeno |

## Scripts disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Iniciar producción
npm run db:push      # Sincronizar DB
npm run db:seed      # Cargar datos iniciales
npm run db:studio    # Prisma Studio (GUI DB)
npm run db:reset     # Reset y seed DB
```

## Licencia

MIT
