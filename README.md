# Wedding Invitation System

A modern, multi-tenant digital wedding invitation platform with personalized guest links, RSVP/wishes tracking, and admin panel.

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Hono + TypeScript + Drizzle ORM
- **Database**: PostgreSQL 16
- **Auth**: JWT + bcrypt
- **Storage**: Local On-Premise Storage (for images/audio)
- **Deployment**: Docker + Docker Compose

---

## Installation

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)


### 1. Clone the Repository

```bash
git clone https://github.com/your-username/invitation.git
cd invitation
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Database
POSTGRES_USER=wedding
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=wedding_invitation

# Authentication
JWT_SECRET=your_jwt_secret_min_32_characters


```

> **Tip**: Generate a secure JWT secret with: `openssl rand -base64 32`

---

## Development

Start all services in development mode:

```bash
docker compose up
```

Access the applications:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Admin Panel | http://localhost:5173/admin |

### Development Features
- Hot reload enabled for both frontend and backend
- Source files mounted as volumes
- PostgreSQL data persisted in Docker volume

### Stop Services

```bash
docker compose down
```

---

## Production Deployment

### 1. Configure Production Environment

```bash
cp .env.production.example .env
```

Update `.env` with **secure production values**:

```env
# Use strong passwords in production!
POSTGRES_PASSWORD=super_secure_password_here
JWT_SECRET=production_jwt_secret_at_least_32_chars
```

### 2. Build and Run

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### 3. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api/* |

### Production Architecture

```
Frontend container (:3000 via serve) → exposed on host :5173
Backend container  (:3000)           → exposed on host :3000
```

> **Note**: Configure your own reverse proxy (e.g. Nginx) separately to handle SSL termination, domain routing, and static file caching.

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
```

### Stop Production

```bash
docker compose -f docker-compose.prod.yml down
```

---

## Project Structure

```
/invitation
├── docker-compose.yml         # Development setup
├── docker-compose.prod.yml    # Production setup
├── docker-compose.deploy.yml  # On-premises deploy (pre-built images)
├── backend/
│   ├── src/
│   │   ├── db/                # Database schema & migrations
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth middleware
│   │   └── utils/             # Utilities (Storage, JWT)
│   ├── Dockerfile             # Development
│   └── Dockerfile.prod        # Production
└── frontend/
    ├── src/
    │   ├── components/        # React components
    │   ├── pages/             # Page components
    │   ├── hooks/             # Custom hooks
    │   └── api/               # API client
    ├── Dockerfile             # Development
    └── Dockerfile.prod        # Production
```

---

## API Endpoints

### Public (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/:slug` | Get wedding details |
| GET | `/api/public/:slug/wishes` | Get approved wishes |
| POST | `/api/public/:slug/wishes` | Submit a wish/RSVP |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Admin (JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/weddings` | List/Create weddings |
| GET/PUT/DELETE | `/api/weddings/:id` | Manage wedding |
| GET/POST | `/api/weddings/:id/guests` | Manage guests |
| GET/POST | `/api/weddings/:id/events` | Manage events |
| GET | `/api/weddings/:id/wishes` | View all wishes |

### File Uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/uploads` | Upload a file (auth required) |
| GET | `/api/uploads/file/*` | Serve uploaded files |
| DELETE | `/api/uploads/file/*` | Delete uploaded file (auth required) |

---

## Troubleshooting

### Database Connection Failed
```bash
# Check if postgres is running
docker compose ps

# View postgres logs
docker compose logs postgres
```

### Backend Not Starting
```bash
# Check backend logs for errors
docker compose logs backend

# Ensure migrations ran successfully
docker compose exec backend npm run db:migrate
```

### Upload Errors
- Check backend logs: `docker compose logs backend`
- Verify uploads volume is mounted: `docker compose exec backend ls -la /app/uploads`

---

## License

MIT
