# Smart Tabula

> Intelligent food ordering and menu management system for companies

Smart Tabula is a comprehensive solution for managing daily menus, food orders, and dietary requirements in corporate environments. Built with modern technologies and designed for self-hosted deployment.

## Features

### For Employees
- **Daily Menu View** - Browse today's menu with detailed dish information
- **Smart Ordering** - Place orders with automatic allergy warnings
- **Allergy Management** - Register allergies with severity levels (Low/Medium/High)
- **Dietary Preferences** - Set preferences (Vegetarian, Vegan, Halal, Kosher, etc.)
- **Absence Calendar** - Register vacations, sick days, or remote work
- **Skip Meal** - Mark specific days when not using the cafeteria
- **Notifications** - Receive alerts when new menus are published

### For Administrators
- **Dashboard** - Real-time statistics on orders, revenue, and popular dishes
- **Menu Management** - Create, edit, and publish daily/weekly menus
- **Dish Catalog** - Manage dishes with categories, allergens, tags, and pricing
- **User Management** - View employees, their allergies, and preferences
- **Allergen Database** - Manage the 14 EU mandatory allergens
- **Order Overview** - Track daily orders and confirm/complete them

### Technical Features
- **RESTful API** - Full API for external integrations (CRM, ERP, etc.)
- **Role-based Access** - Admin and Employee roles with appropriate permissions
- **Health Check** - Built-in endpoint for monitoring (`/api/health`)
- **100% Local** - No cloud dependencies, runs entirely on your infrastructure

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS 4 |
| Database | SQLite (via Prisma 6) |
| Authentication | NextAuth.js v5 |
| State Management | TanStack Query |
| Containerization | Docker + Docker Compose |

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/smart-tabula.git
cd smart-tabula

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings (especially NEXTAUTH_SECRET)

# Initialize database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

## Default Credentials

After running `npm run db:seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smarttabula.com | admin123 |

> **Important**: Change the admin password immediately in production!

## Project Structure

```
smart-tabula/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Initial data (allergies, dishes, admin)
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── menus/     # Menu CRUD + publish
│   │   │   ├── dishes/    # Dish management
│   │   │   ├── orders/    # Order handling
│   │   │   ├── absences/  # Absence management
│   │   │   └── ...
│   │   ├── admin/         # Admin dashboard pages
│   │   ├── dashboard/     # Employee dashboard
│   │   ├── menu/          # Menu view + ordering
│   │   ├── profile/       # User profile + allergies
│   │   └── ...
│   ├── components/
│   │   ├── layout/        # Sidebar, Header, etc.
│   │   └── ui/            # shadcn/ui components
│   ├── lib/
│   │   ├── auth/          # NextAuth configuration
│   │   └── prisma.ts      # Prisma client
│   └── types/             # TypeScript types & enums
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## API Reference

### Public Endpoints (require authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/menus` | List all menus |
| `GET` | `/api/menus/:id` | Get menu details |
| `GET` | `/api/dishes` | List available dishes |
| `GET` | `/api/orders` | Get user's orders |
| `POST` | `/api/orders` | Create new order |
| `PUT` | `/api/orders` | Update existing order |
| `GET` | `/api/users/profile` | Get current user profile |
| `PUT` | `/api/users/profile` | Update profile (allergies, preferences) |
| `GET` | `/api/absences` | Get user's absences |
| `POST` | `/api/absences` | Register absence |
| `DELETE` | `/api/absences/:id` | Cancel absence |
| `POST` | `/api/skip-meals` | Mark day as "not eating" |
| `GET` | `/api/notifications` | Get notifications |
| `GET` | `/api/health` | Health check |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/menus` | Create menu |
| `PUT` | `/api/menus/:id` | Update menu |
| `DELETE` | `/api/menus/:id` | Delete menu |
| `POST` | `/api/menus/:id/publish` | Publish menu & notify users |
| `POST` | `/api/dishes` | Create dish |
| `PUT` | `/api/dishes/:id` | Update dish |
| `DELETE` | `/api/dishes/:id` | Delete/deactivate dish |
| `POST` | `/api/allergies` | Create allergen |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `NEXTAUTH_SECRET` | Secret for JWT tokens | **Required** |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | App name shown in UI | `Smart Tabula` |

Generate a secure secret:
```bash
openssl rand -base64 32
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed initial data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:reset` | Reset database and reseed |

## Database Schema

The application uses the following main entities:

- **User** - Employees and administrators
- **Allergy** - EU mandatory allergens (14 types)
- **UserAllergy** - User's registered allergies with severity
- **UserPreference** - Dietary preferences (vegetarian, vegan, etc.)
- **Menu** - Daily menus with publication status
- **Dish** - Food items with categories, tags, and allergens
- **Order** - User orders with status tracking
- **Absence** - Scheduled absences (vacation, sick, remote)
- **SkipMeal** - Single-day meal skips
- **Notification** - System notifications

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ using Next.js, Prisma, and shadcn/ui
