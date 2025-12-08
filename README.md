# Wedding Invitation System

A modern, multi-tenant digital wedding invitation platform with personalized guest links, RSVP/wishes tracking, and admin panel.

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Hono + TypeScript + Drizzle ORM
- **Database**: PostgreSQL 16
- **Auth**: JWT + bcrypt
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)

### Development

1. Clone the repository and start services:

```bash
# Start all services (PostgreSQL, backend, frontend)
docker-compose up -d

# Or run in foreground to see logs
docker-compose up
```

2. Access the applications:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000
   - **Admin Panel**: http://localhost:5173/admin

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Project Structure

```
/invitation
├── docker-compose.yml      # Development Docker setup
├── docker-compose.prod.yml # Production Docker setup
├── backend/                # Hono API server
│   ├── src/
│   │   ├── db/            # Database schema & migrations
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth middleware
│   │   └── utils/         # Utilities
│   └── Dockerfile
└── frontend/               # Vite React app
    ├── src/
    │   ├── components/    # React components
    │   ├── pages/         # Page components
    │   ├── hooks/         # Custom hooks
    │   └── api/           # API client
    └── Dockerfile
```

## API Endpoints

### Public (No Auth)
- `GET /api/public/:slug` - Get wedding details
- `GET /api/public/:slug/wishes` - Get approved wishes
- `POST /api/public/:slug/wishes` - Submit a wish/RSVP

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin (JWT Required)
- `GET/POST /api/weddings` - List/Create weddings
- `GET/PUT/DELETE /api/weddings/:id` - Manage wedding
- `GET/POST /api/weddings/:id/guests` - Manage guests
- `GET/POST /api/weddings/:id/events` - Manage events
- `GET /api/weddings/:id/wishes` - View all wishes

## License

MIT
