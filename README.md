# Loopify Node Backend

A modern, scalable backend for Loopify, built with Node.js, TypeScript, Express, Apollo Server (GraphQL), Prisma ORM, PostgreSQL, and Redis. This project provides a robust API for marketplace-style applications, supporting authentication, item management, user interactions, and more.

---

## Features

- **GraphQL API** powered by Apollo Server
- **Express.js** for middleware and HTTP handling
- **Prisma ORM** for PostgreSQL database access
- **Redis** for caching and session management
- **Authentication** with JWT and refresh tokens
- **User, Item, Order, and Comment models**
- **Zod** for schema validation and input safety
- **CORS** for secure cross-origin requests
- **Helmet** for enhanced HTTP security
- **Logging** with Winston for robust, configurable logs
- **Docker Compose** for easy local development
- **Code quality** enforced with ESLint, Prettier, Husky, and lint-staged

---

## Tech Stack

- **Node.js** & **TypeScript**
- **Express.js**
- **Apollo Server (GraphQL)**
- **Prisma ORM**
- **PostgreSQL**
- **Redis**
- **Docker Compose**
- **ESLint, Prettier, Husky**

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Docker & Docker Compose (for local DB/Redis)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/loopify-server.git
cd loopify-server
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up environment variables

Create a `.env` file in the root directory. Example:

```env
DATABASE_URL=postgresql://loopify:123456@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
PORT=3000
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### 4. Start PostgreSQL and Redis with Docker Compose

```bash
docker-compose up -d
```

### 5. Run database migrations

```bash
npx prisma migrate deploy
# or for development:
npx prisma migrate dev
```

### 6. Start the development server

```bash
npm run dev
# or
yarn dev
```

The server will be running at [http://localhost:3000/graphql](http://localhost:3000/graphql)

---

## Scripts

- `npm run dev` — Start the server in development mode with hot reload
- `npm run build` — Build the project
- `npm start` — Start the production build
- `npm run lint` — Run ESLint
- `npm run lint:fix` — Fix lint errors
- `npm run format` — Format code with Prettier
- `npm run codegen` — Run GraphQL code generation

---

## Database

- **Prisma ORM** manages the PostgreSQL schema (see `prisma/schema.prisma`).
- Migrations are stored in `prisma/migrations/`.
- Update the schema and run `npx prisma migrate dev` to apply changes.

---

## Code Quality

- **ESLint** and **Prettier** for linting and formatting
- **Husky** and **lint-staged** for pre-commit checks

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## Contact

Created by Will Shi. For questions, please open an issue.
