# 🚀 NestJS Starter Kit

This NestJS Starter Kit is designed as a **production-ready**, modular, and scalable backend foundation. It provides a clean architecture and common features required to build modern APIs efficiently and consistently.

---

## ✨ Features

- ✅ Authentication (Register, Login, Refresh Token, Forgot Password, Email Verification, etc)
- 🔐 JWT-based Authentication & Guards
- 📄 API Documentation integrated with **Scalar**
- 📬 Mail Service (Email Verification & Forgot Password)
- 🪵 Custom Logging System
- 🌍 Environment Configuration
- 🐳 Docker Configuration
- 🧪 End-to-End Testing (Jest)
- 🧹 Husky & Commitlint (Git Hooks)
- 🧱 Modular & Clean Architecture

---

## 📁 Project Structure

```
├── src
│   ├── common
│   │   ├── decorators        # Custom decorators
│   │   ├── enums             # Global enums
│   │   ├── filters           # Global exception filters
│   │   ├── guards            # Authentication guards
│   │   └── interceptors      # Response interceptors
│   │
│   ├── core
│   │   ├── configs           # Application & security configuration
│   │   ├── database          # Database module
│   │   ├── logger            # Custom logger implementation
│   │   ├── mail              # Mail services & templates
│   │   ├── services          # Core reusable services
│   │   └── types             # Global type definitions
│   │
│   ├── modules
│   │   ├── auth              # Authentication module
│   │   ├── users             # Users module
│   │   └── modules.module.ts
│   │
│   ├── shared
│   │   ├── dto               # Shared DTOs
│   │   ├── interfaces        # Shared interfaces
│   │   └── utils             # Utility functions
│   │
│   ├── main.module.ts        # Root module
│   └── main.ts               # Application entry point
│
├── test                       # E2E tests
├── tsconfig.json
└── package.json
```

---

## 🧩 Folder Overview

### `common/`

Contains global and reusable components used across the application:

- **Decorators** → Custom decorators (e.g. `@CurrentUser`)
- **Enums** → Application-wide enums
- **Filters** → Global exception handling
- **Guards** → JWT authentication guards
- **Interceptors** → Standardized API response format

---

### `core/`

Holds the core infrastructure of the application:

- **configs** → JWT and application configuration
- **database** → Database initialization module
- **logger** → Custom logging service
- **mail** → Mail services and Handlebars templates
- **services** → Core reusable services (e.g. token service)
- **types** → Global type extensions

---

### `modules/`

Uses a **feature-based modular architecture**.

#### `auth/`

Handles all authentication-related workflows:

- User registration & email verification
- Login & refresh token
- Forgot & reset password

#### `users/`

Handles user-related data and operations.

Each module typically consists of:

- Controller
- Service
- DTOs
- Entity (if applicable)

---

### `shared/`

Contains shared resources used across modules:

- Base response DTO
- API response interfaces
- JWT payload interfaces
- Utility helpers

---

## 🔐 Authentication Flow

1. User registers → Verification email is sent
2. User verifies email → Account activated
3. User logs in → Access token & refresh token issued
4. Refresh token → Generates a new access token
5. Forgot password → Password reset email sent

---

## 📄 API Documentation (Scalar)

API documentation is integrated using **Scalar**.

Once the application is running, access the documentation at:

```
http://localhost:<PORT>/docs
```

---

## 🪵 Custom Logger

This starter kit includes a centralized custom logger used for:

- HTTP request & response logging
- Error handling
- Application-level logs

Logger configuration can be found at:

```
src/core/logger
```

---

## 🐳 Docker Support

Run the application using Docker:

```bash
docker-compose up --build
```

---

## 🌍 Environment Configuration

Configure the application using a `.env` file:

```env
# =====================
# App
# =====================
APP_NAME=
APP_URL=http://localhost:3000
PORT=3000
NODE_ENV=development

# =====================
# Database
# =====================
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=
DB_USERNAME=
DB_PASSWORD=
DB_SYNCHRONIZE=true

# =====================
# JWT
# =====================
JWT_ACCESS_TOKEN_SECRET=
JWT_ACCESS_EXPIRES_IN=3600
JWT_REFRESH_TOKEN_SECRET=
JWT_REFRESH_EXPIRES_IN=604800
JWT_VERIFY_EMAIL_SECRET=
JWT_VERIFY_EMAIL_EXPIRES_IN=3600
JWT_FORGOT_PASSWORD_SECRET=
JWT_FORGOT_PASSWORD_EXPIRES_IN=3600

# =====================
# Redis (optional)
# =====================
REDIS_HOST=localhost
REDIS_PORT=6379

# =====================
# Mailer (optional)
# =====================
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=

# =====================
# Frontend URL
# =====================
FRONTEND_URL=

# =====================
# CORS
# =====================
CORS_ORIGINS=
CORS_CREDENTIALS=true


```

---

## 🧪 Testing

Run end-to-end tests using Jest:

```bash
npm run test:e2e
```

---

## 🧹 Git Hooks

This project is integrated with:

- **Husky**
- **Commitlint**

To enforce commit message standards and maintain code quality.

---

## ▶️ Running the Application

### Development

```bash
npm install
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

---

## 📌 Notes

This starter kit is suitable for:

- Backend APIs
- SaaS platforms
- Internal services
- Microservice foundations

Feel free to extend and customize it based on your project needs 🚀

---

## 📄 License

MIT License
