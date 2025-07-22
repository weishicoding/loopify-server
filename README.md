# Loopify Node Backend

A modern, scalable backend for Loopify, built with Node.js(https://nodejs.org/), TypeScript(https://www.typescriptlang.org/), Express(https://expressjs.com/), Apollo Server (GraphQL)(https://www.apollographql.com/docs/apollo-server/), Prisma ORM(https://www.prisma.io/), PostgreSQL, and Redis. This project provides a robust API for marketplace-style applications, supporting authentication, item management, user interactions, and more.

---

## Features

- [**GraphQL API**](https://www.apollographql.com/docs/apollo-server/) powered by Apollo Server
- [**Express.js**](https://expressjs.com/) for middleware and HTTP handling
- [**Prisma ORM**](https://www.prisma.io/) for PostgreSQL database access
- [**Redis**](https://redis.io/) for caching and session management
- **Authentication** with JWT and refresh tokens
- **User, Item, Order, and Comment models**
- [**Zod**](https://zod.dev/) for schema validation and input safety
- [**CORS**](https://expressjs.com/en/resources/middleware/cors.html) for secure cross-origin requests
- [**Helmet**](https://helmetjs.github.io/) for enhanced HTTP security
- **Logging** with [Winston](https://github.com/winstonjs/winston) for robust, configurable logs
- [**Docker Compose**](https://docs.docker.com/compose/) for easy local development
- **Code quality** enforced with [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), and [Husky](https://typicode.github.io/husky/), and lint-staged

---

## Tech Stack

- [**Node.js**](https://nodejs.org/)
- [**TypeScript**](https://www.typescriptlang.org/)
- [**Express.js**](https://expressjs.com/)
- [**Apollo Server (GraphQL)**](https://www.apollographql.com/docs/apollo-server/)
- [**Prisma ORM**](https://www.prisma.io/)
- [**PostgreSQL**](https://www.postgresql.org/)
- [**Redis**](https://redis.io/)
- [**Docker Compose**](https://docs.docker.com/compose/)
- [**ESLint**](https://eslint.org/), [**Prettier**](https://prettier.io/), [**Husky**](https://typicode.github.io/husky/)

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
