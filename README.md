# HNG Stage 8 - Google OAuth & Paystack Payment Integration

A NestJS backend application implementing Google Sign-In and Paystack payment functionalities.

## Features

- ✅ Google OAuth 2.0 authentication
- ✅ JWT token-based authorization
- ✅ Paystack payment initialization
- ✅ Webhook handling for payment status updates
- ✅ Transaction status verification
- ✅ PostgreSQL database with TypeORM
- ✅ Idempotency for duplicate transactions

## Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Authentication:** Google OAuth 2.0 + JWT
- **Payment:** Paystack
- **Language:** TypeScript
- **Package Manager:** pnpm

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- Google OAuth credentials
- Paystack account

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/PaulsCreate/HNG13_Stage-8.git
cd HNG13_Stage-8
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Create `.env` file
```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4000

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=hng_app

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRATION=24h

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Paystack Integration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
PAYSTACK_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 4. Create PostgreSQL database
```bash
createdb hng_app
```

### 5. Run migrations
```bash
pnpm run migration:run
```

### 6. Run the application
```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
```

The application will start on `http://localhost:4000`

## API Endpoints

### Authentication

#### 1. Get Google OAuth URL
```
GET /auth/google/url
```

**Response:**
```json
{
  "google_auth_url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

#### 2. Trigger Google Sign-In
```
GET /auth/google
```
Redirects to Google OAuth consent page.

#### 3. Google OAuth Callback
```
GET /auth/google/callback
```
Handles the OAuth callback and returns JWT token.

**Response:**
```json
{
  "success": true,
  "message": "Google authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "38eee9c0-8cd2-423c-a575-f168f679ce6f",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://..."
  }
}
```

#### 4. Test Token Generation (Development Only)
```
GET /auth/test/token
```
Generates a test JWT without Google OAuth.

### Payments (JWT Required)

#### 5. Initiate Payment
```
POST /payments/paystack/initiate
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 5000
}
```

**Response:**
```json
{
  "reference": "HKG_78b50e9b8e3f4db491f6",
  "authorization_url": "https://checkout.paystack.com/..."
}
```

#### 6. Check Transaction Status
```
GET /payments/:reference/status
GET /payments/:reference/status?refresh=true
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "reference": "HKG_78b50e9b8e3f4db491f6",
  "status": "success",
  "amount": 5000,
  "paid_at": "2025-12-07T21:30:00.000Z"
}
```

#### 7. Webhook Endpoint
```
POST /payments/paystack/webhook
```
Receives payment status updates from Paystack. Validates signature automatically.

## Webhook Testing

For local testing, the `/payments/:reference/status?refresh=true` endpoint can be used to verify transactions directly with Paystack's API.

For production webhook testing with Paystack callbacks, expose the webhook endpoint using a tool like ngrok:

```bash
ngrok http 4000
```

Then update your Paystack webhook URL to: `https://your-ngrok-url.ngrok.io/payments/paystack/webhook`

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `googleId` (Unique)
- `email` (Unique)
- `name`
- `picture`
- `emailVerified`
- `createdAt`
- `updatedAt`

### Transactions Table
- `id` (UUID, Primary Key)
- `reference` (Unique)
- `amount` (Decimal)
- `status` (Enum: pending, success, failed, abandoned)
- `paystackReference`
- `authorizationUrl`
- `paidAt`
- `userId` (Foreign Key)
- `metadata` (JSONB)
- `createdAt`
- `updatedAt`

## Security Features

- JWT token-based authentication
- Environment variables for sensitive data
- Webhook signature verification (HMAC SHA-512)
- Idempotency for duplicate transactions
- Input validation using class-validator

## Testing

### Manual Testing

**1. Google OAuth:**
- Open browser: `http://localhost:4000/auth/google`
- Complete Google login
- Verify JWT token returned

**2. Paystack Payment:**
```bash
# Get test token
TOKEN=$(curl -s http://localhost:3000/auth/test/token | jq -r '.token')

# Initiate payment
curl -X POST http://localhost:3000/payments/paystack/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 5000}'

# Check status
curl "http://localhost:3000/payments/HKG_78b50e9b8e3f4db491f6/status" \
  -H "Authorization: Bearer $TOKEN"
```

### Paystack Test Cards

| Card Number | Purpose | CVV | PIN | OTP |
|-------------|---------|-----|-----|-----|
| 5061068888206402458 | Successful payment | 123 | 1234 | 123456 |
| 4084080000000408 | Declined payment | 408 | 0000 | 123456 |

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `402` - Payment Required
- `404` - Not Found
- `500` - Internal Server Error

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Application port | No (default: 4000) |
| `NODE_ENV` | Environment mode | No (default: development) |
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_PORT` | PostgreSQL port | Yes |
| `DB_USERNAME` | Database username | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `DB_DATABASE` | Database name | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRATION` | Token expiration | No (default: 24h) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Yes |
| `GOOGLE_CALLBACK_URL` | OAuth redirect URI | Yes |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | Yes |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | No |
| `PAYSTACK_WEBHOOK_SECRET` | Webhook signature secret | Yes |
| `FRONTEND_URL` | Frontend application URL | No |

## Project Structure

```
src/
├── entities/
│   ├── user.entity.ts
│   └── transaction.entity.ts
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── strategies/
│       ├── google.strategy.ts
│       └── jwt.strategy.ts
├── payments/
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   ├── payments.module.ts
│   └── paystack.service.ts
├── app.module.ts
└── main.ts
```

## Screenshots

![Screenshot 1](https://github.com/user-attachments/assets/04bdad0b-6d85-4a76-abae-c59cfba2e0dc)

![Screenshot 2](https://github.com/user-attachments/assets/15d0a9aa-dff0-4fa1-aea0-f20d076a1664)

![Screenshot 3](https://github.com/user-attachments/assets/1dc47deb-0b59-409c-a6a8-f5acf6444d5)

![Screenshot 4](https://github.com/user-attachments/assets/ca0ded8f-da83-49a5-82bf-11aecba9bfc9)

![Screenshot 5](https://github.com/user-attachments/assets/2bbf63e1-cfd2-4146-b7f4-d1587ab99260)

## Author

**Paul Yusuf** - HNG Stage 8 Backend Task

## License

MIT