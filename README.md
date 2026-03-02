# GraphGen - Backend API

A RESTful backend API for **GraphGen** — a platform that generates various engineering diagrams and graphs. Built with Node.js, Express, and MongoDB Atlas.

---

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Authentication:** JSON Web Tokens (JWT)
- **Password Hashing:** bcrypt
- **Email Service:** Nodemailer (Mailtrap for dev)
- **File Upload:** Multer
- **Storage:** Supabase
- **Rate Limiting:** express-rate-limit

---

## Project Structure

```
backend/
├── server.js                # Entry point - starts server & DB connection
├── app.js                   # Express app setup & middleware
├── configure/
│   └── mongoDB.js           # MongoDB Atlas connection
├── controllers/
│   ├── authorization.js     # JWT-based route protection middleware
│   ├── authentication/
│   │   ├── createUser.js    # User registration (sign-up)
│   │   ├── verifyEmail.js   # Email verification via token
│   │   ├── login.js         # User login & JWT issuance
│   │   ├── password.js      # Forgot password (sends reset email)
│   │   └── resetPassword.js # Password reset (GET form + POST handler)
│   └── Error/
│       ├── globalErrorhandler.js  # Global error handling middleware
│       ├── developmentError.js    # Dev-mode error response
│       └── production.js         # Production error response
├── models/
│   └── userModel.js         # Mongoose User schema & methods
├── routes/
│   └── userRoute.js         # Auth routes
├── service/
│   ├── email.js             # Email templates & sending (Nodemailer)
│   ├── JWT.js               # JWT sign & verify helpers
│   └── token.js             # Crypto token generator
└── utils/
    ├── asyncFunctionHandler.js  # Async error wrapper for controllers
    └── customError.js           # Custom error class
```

---

## Features Completed

### Authentication

- **Sign Up** — Register with name, email & password. Sends a verification email with a tokenized link.
- **Email Verification** — Verifies user via token link. Tokens expire after 10 minutes.
- **Login** — Authenticates user credentials and returns a JWT (1-hour expiry).
- **Forgot Password** — Sends a password reset link to the user's email.
- **Reset Password** — Serves an HTML form for password reset and processes the new password.

### Authorization

- **JWT-based route protection** — Middleware that validates tokens, checks user existence, and detects password changes after token issuance.

### Security

- **Password hashing** with bcrypt (salt rounds via env variable).
- **Rate limiting** on sensitive routes (forgot/reset password) — 5 requests per 10 minutes.
- **Password change detection** — Invalidates old JWTs after password reset.

### Error Handling

- **Global error handler** with separate dev/production error responses.
- **Custom error class** with status codes and operational error tracking.
- **Async function wrapper** to catch promise rejections automatically.
- **404 handler** for undefined routes.

### Database

- **MongoDB Atlas** connection with graceful shutdown on failure.
- **User model** with email validation, password hashing pre-save hook, and password comparison method.

---

## API Endpoints

| Method | Endpoint                          | Description                  | Rate Limited |
| ------ | --------------------------------- | ---------------------------- | ------------ |
| POST   | `/api/auth/sign-up`               | Register a new user          | No           |
| GET    | `/api/auth/verify/:token`         | Verify email address         | No           |
| POST   | `/api/auth/login`                 | Login & get JWT              | No           |
| POST   | `/api/auth/forgot-password`       | Request password reset email | Yes          |
| GET    | `/api/auth/reset-password/:token` | Get password reset form      | No           |
| POST   | `/api/auth/reset-password/:token` | Submit new password          | Yes          |

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas account
- Mailtrap account (for dev email testing)

### Installation

```bash
git clone <repository-url>
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
NODE_ENV=DEV
SALTROUNDS=10
SECRECT_CODE=your_jwt_secret_key
```

### Run the Server

```bash
# Development (with nodemon)
npm run dev

# Production
node server.js
```

The server starts on **port 5050**.

---

## Dependencies

| Package               | Purpose               |
| --------------------- | --------------------- |
| express               | Web framework         |
| mongoose              | MongoDB ODM           |
| bcrypt                | Password hashing      |
| jsonwebtoken          | JWT authentication    |
| nodemailer            | Email sending         |
| dotenv                | Environment variables |
| express-rate-limit    | Rate limiting         |
| multer                | File upload handling  |
| @supabase/supabase-js | Cloud storage         |

### Dev Dependencies

| Package | Purpose                        |
| ------- | ------------------------------ |
| nodemon | Auto-restart server on changes |
