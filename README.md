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
- **Recurring Absences** - Set recurring patterns (e.g., "Never eat on Fridays")
- **Dish Ratings** - Rate and review dishes (1-5 stars with comments)
- **Notifications** - Receive alerts when new menus are published
- **Multi-language** - Switch between English and Spanish

### For Administrators
- **Dashboard** - Real-time statistics on orders, revenue, and popular dishes
- **Menu Management** - Create, edit, and publish daily/weekly menus
- **Dish Catalog** - Manage dishes with categories, allergens, tags, and pricing
- **User Management** - View employees, their allergies, and preferences
- **Allergen Database** - Manage the 14 EU mandatory allergens
- **Order Overview** - Track daily orders and confirm/complete them

### For Kitchen Staff
- **Kitchen View** - See all orders grouped by dish for efficient preparation
- **Allergy Alerts** - View customer allergies for each order
- **CSV Export** - Export orders as summary or detailed reports
- **Order Statistics** - Track pending, confirmed, and completed orders

### Technical Features
- **RESTful API** - Full API for external integrations (CRM, ERP, etc.)
- **Role-based Access** - Admin, Employee, and Kitchen roles with appropriate permissions
- **Order Deadline** - Configurable order cut-off time
- **Health Check** - Built-in endpoint for monitoring (`/api/health`)
- **Multi-Database** - SQLite (default) or PostgreSQL
- **Internationalization** - Multi-language support (English, Spanish)
- **100% Local** - No cloud dependencies, runs entirely on your infrastructure

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS 4 |
| Database | SQLite / PostgreSQL (via Prisma 7) |
| Authentication | NextAuth.js v5 |
| State Management | TanStack Query |
| Internationalization | next-intl |
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

#### With SQLite (default)

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

#### With PostgreSQL

```bash
# Build and start with PostgreSQL
docker-compose -f docker-compose.postgres.yml up -d

# View logs
docker-compose -f docker-compose.postgres.yml logs -f

# Stop
docker-compose -f docker-compose.postgres.yml down
```

## Default Credentials

After running `npm run db:seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smarttabula.com | admin123 |

> **Important**: Change the admin password immediately in production!

## User Workflows

### Employee Ordering Flow

1. **Login** - Employee logs in with their credentials
2. **View Menu** - Navigate to "Today's Menu" to see available dishes
3. **Check Deadline** - Verify orders are still open (before deadline time)
4. **Select Dishes** - Choose dishes from each category (starter, main, side, dessert, drink)
5. **Review Allergies** - System warns if any dish contains registered allergens
6. **Place Order** - Confirm the order
7. **Receive Confirmation** - Order status changes to "PENDING"
8. **Order Confirmed** - Admin/Kitchen confirms the order, status changes to "CONFIRMED"

### Admin Menu Management Flow

1. **Create Dishes** - Go to Admin > Dishes and add new dishes with:
   - Name, description, category
   - Price and calories
   - Allergens and tags (vegetarian, spicy, etc.)
2. **Create Menu** - Go to Admin > Menus and create a new menu:
   - Set the date
   - Add dishes to the menu
   - Save as draft
3. **Publish Menu** - When ready, publish the menu
   - All employees receive a notification
   - Orders open immediately
4. **Monitor Orders** - View incoming orders in Admin > Orders
5. **Confirm Orders** - Confirm orders for kitchen preparation

### Kitchen Preparation Flow

1. **Access Kitchen View** - Kitchen staff login and access /kitchen
2. **View Today's Orders** - See all orders grouped by dish:
   - Total quantity per dish
   - Customer names and departments
   - Special notes and allergy alerts
3. **Prepare Dishes** - Cook based on quantities shown
4. **Handle Allergies** - Red badges highlight customers with allergies
5. **Export Orders** - Download CSV for external tracking:
   - Summary: Dish quantities only
   - Detailed: Full order information with customer details

### Absence Management Flow

1. **Schedule Absence** - Go to Absences and click "Add Absence"
   - Select start and end dates
   - Choose reason (Vacation, Sick, Remote, Other)
   - Add optional notes
2. **Set Recurring Patterns** - For regular patterns:
   - Go to "Recurring Absences"
   - Select day of week (e.g., Friday)
   - Choose meal (Breakfast, Lunch, Dinner)
   - System will automatically skip these days
3. **Skip Single Day** - For one-off skips:
   - Use "Skip Meal" for a specific date
   - No order will be expected for that day

## Project Structure

```
smart-tabula/
├── prisma/
│   ├── prisma.config.ts   # Multi-database configuration
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Initial data (allergies, dishes, admin)
├── messages/
│   ├── en.json            # English translations
│   └── es.json            # Spanish translations
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── menus/     # Menu CRUD + publish
│   │   │   ├── dishes/    # Dish management
│   │   │   ├── orders/    # Order handling
│   │   │   ├── kitchen/   # Kitchen view + export
│   │   │   ├── ratings/   # Dish ratings
│   │   │   ├── absences/  # Absence management
│   │   │   ├── recurring-absences/  # Recurring patterns
│   │   │   ├── order-deadline/      # Deadline check
│   │   │   └── ...
│   │   ├── admin/         # Admin dashboard pages
│   │   ├── kitchen/       # Kitchen view page
│   │   ├── dashboard/     # Employee dashboard
│   │   ├── menu/          # Menu view + ordering
│   │   ├── profile/       # User profile + allergies
│   │   └── ...
│   ├── components/
│   │   ├── layout/        # Sidebar, Header, etc.
│   │   ├── language-switcher.tsx  # Language toggle
│   │   └── ui/            # shadcn/ui components
│   ├── i18n/
│   │   ├── config.ts      # i18n configuration
│   │   └── request.ts     # next-intl setup
│   ├── lib/
│   │   ├── auth/          # NextAuth configuration
│   │   ├── db.ts          # Database adapter factory
│   │   ├── prisma.ts      # Prisma client
│   │   └── order-deadline.ts  # Deadline utilities
│   └── types/             # TypeScript types & enums
├── docker-compose.yml           # SQLite deployment
├── docker-compose.postgres.yml  # PostgreSQL deployment
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
| `GET` | `/api/recurring-absences` | Get recurring patterns |
| `POST` | `/api/recurring-absences` | Create recurring absence |
| `DELETE` | `/api/recurring-absences?id=` | Delete recurring pattern |
| `GET` | `/api/ratings?dishId=` | Get dish ratings |
| `POST` | `/api/ratings` | Rate a dish (1-5 stars) |
| `GET` | `/api/notifications` | Get notifications |
| `GET` | `/api/order-deadline` | Check order deadline status |
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

### Kitchen Endpoints (Admin & Kitchen roles)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/kitchen/orders?date=` | Get orders grouped by dish |
| `GET` | `/api/kitchen/export?date=&type=` | Export orders as CSV |

**Export types:**
- `summary` - Dish, Category, Quantity
- `detailed` - Full order info with customer details

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection URL | `file:./dev.db` |
| `NEXTAUTH_SECRET` | Secret for JWT tokens | **Required** |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | App name shown in UI | `Smart Tabula` |
| `ORDER_DEADLINE` | Order cut-off time (HH:MM) | `10:00` |
| `TZ` | Timezone for deadline | `Europe/Madrid` |

### Database Configuration

Smart Tabula supports multiple databases via Prisma 7 adapters:

| Database | `DATABASE_URL` Example |
|----------|------------------------|
| SQLite (default) | `file:./dev.db` or `file:/path/to/database.sqlite` |
| PostgreSQL | `postgresql://user:password@localhost:5432/smarttabula` |

**Note**: MySQL support is planned for future releases when official Prisma adapters become available.

Generate a secure secret:
```bash
openssl rand -base64 32
```

## Order Deadline System

The order deadline system prevents orders after a configurable cut-off time:

**Configuration:**
```env
ORDER_DEADLINE=10:00  # Orders close at 10:00 AM
TZ=Europe/Madrid      # Timezone for deadline
```

**Behavior:**
- Orders for TODAY are blocked after the deadline
- Orders for FUTURE dates are always allowed
- Orders for PAST dates are never allowed

**API Response (`/api/order-deadline`):**
```json
{
  "deadline": "10:00",
  "allowed": true,
  "remaining": "2h 30m",
  "forDate": "2024-01-15"
}
```

## Multi-Language Support

Smart Tabula supports multiple languages with next-intl:

**Available languages:**
- English (default)
- Spanish (Espa~ol)

**Switching language:**
- Click the globe icon in the header
- Select your preferred language
- Preference is saved in a cookie

**Adding new languages:**
1. Create `messages/[locale].json` with translations
2. Add locale to `src/i18n/config.ts`
3. Rebuild the application

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

- **User** - Employees and administrators (roles: ADMIN, EMPLOYEE, KITCHEN)
- **Allergy** - EU mandatory allergens (14 types)
- **UserAllergy** - User's registered allergies with severity
- **UserPreference** - Dietary preferences (vegetarian, vegan, etc.)
- **Menu** - Daily menus with publication status
- **Dish** - Food items with categories, tags, and allergens
- **DishRating** - User ratings for dishes (1-5 stars with comments)
- **Order** - User orders with status tracking
- **OrderItem** - Individual items in an order
- **Absence** - Scheduled absences (vacation, sick, remote)
- **RecurringAbsence** - Weekly recurring patterns
- **SkipMeal** - Single-day meal skips
- **Notification** - System notifications
- **SystemConfig** - Application settings

### User Roles

| Role | Description | Access |
|------|-------------|--------|
| EMPLOYEE | Regular users | Menu, orders, profile, absences |
| KITCHEN | Kitchen staff | Employee access + kitchen view |
| ADMIN | Administrators | Full access to all features |

### Multi-Database Support

Smart Tabula uses Prisma 7 with database-specific adapters:

- **SQLite**: `@prisma/adapter-better-sqlite3` with `better-sqlite3`
- **PostgreSQL**: `@prisma/adapter-pg` with `pg`

The database type is automatically detected from the `DATABASE_URL` format. Configuration is handled in:
- `prisma.config.ts` - Prisma CLI configuration
- `src/lib/db.ts` - Database type detection and adapter creation
- `src/lib/prisma.ts` - Async Prisma client initialization

## Health Check

The `/api/health` endpoint provides comprehensive system status:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "status": "connected",
    "type": "sqlite",
    "responseTime": "5ms"
  },
  "stats": {
    "users": 25,
    "menus": 120,
    "orders": 1500
  },
  "config": {
    "orderDeadline": "10:00",
    "timezone": "Europe/Madrid"
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with Next.js, Prisma, and shadcn/ui
