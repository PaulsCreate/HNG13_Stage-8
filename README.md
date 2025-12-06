# HNG Stage 8 - Google OAuth & Paystack Payment Integration

A NestJS backend application implementing Google Sign-In and Paystack payment functionalities.

## Features

- ✅ Google OAuth 2.0 authentication
- ✅ Paystack payment initialization
- ✅ Webhook handling for payment status updates
- ✅ Transaction status verification
- ✅ PostgreSQL database with TypeORM
- ✅ Idempotency for duplicate transactions

## Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Authentication:** Google OAuth 2.0
- **Payment:** Paystack
- **Language:** TypeScript

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- Google OAuth credentials
- Paystack account

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/PaulsCreate/HNG13_Stage-8.git
cd HNG13_Stage-7
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Create `.env` file
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=hng_stage7

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

# Paystack
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret

# App
PORT=4000
NODE_ENV=development
```

### 4. Create PostgreSQL database
```bash
createdb hng_stage7
```

### 5. Run the application
```bash
pnpm run start:dev
```

The application will start on `http://localhost:4000`

## API Endpoints

### Authentication

#### 1. Trigger Google Sign-In
```
GET /auth/google
```
Redirects to Google OAuth consent page.

#### 2. Google OAuth Callback
```
GET /auth/google/callback?code=<authorization_code>
```
Handles the OAuth callback and creates/updates user.

**Response:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://..."
}
```

### Payments

#### 3. Initiate Payment
```
POST /payments/paystack/initiate
```

**Request Body:**
```json
{
  "amount": 5000,
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "reference": "txn_1234567890_abc",
  "authorization_url": "https://checkout.paystack.com/..."
}
```

#### 4. Webhook Endpoint
```
POST /payments/paystack/webhook
```
Receives payment status updates from Paystack. Validates signature automatically.

#### 5. Check Transaction Status
```
GET /payments/:reference/status?refresh=true
```

**Response:**
```json
{
  "reference": "txn_1234567890_abc",
  "status": "success",
  "amount": 5000,
  "paid_at": "2024-12-06T10:30:00.000Z"
}
```

## Webhook Testing

The webhook endpoint is implemented and validates Paystack signatures.

For local testing, the `/payments/:reference/status?refresh=true` endpoint can be used to verify transactions directly with Paystack's API.

For production webhook testing with Paystack callbacks, expose the webhook endpoint using a tool like ngrok:

```bash
ngrok http 4000
```

Then update your Paystack webhook URL to: `https://your-ngrok-url.ngrok.io/payments/paystack/webhook`

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (Unique)
- `name`
- `picture`
- `googleId` (Unique)
- `createdAt`
- `updatedAt`

### Transactions Table
- `id` (UUID, Primary Key)
- `reference` (Unique)
- `amount` (BigInt)
- `status` (Enum: pending, success, failed)
- `authorizationUrl`
- `paidAt`
- `userId` (Foreign Key)
- `createdAt`
- `updatedAt`

## Security Features

- Environment variables for sensitive data
- Webhook signature verification
- Idempotency for duplicate transactions
- Input validation using class-validator

## Testing

### Manual Testing with Postman

**1. Google OAuth:**
- Open browser: `http://localhost:4000/auth/google`
- Complete Google login
- Verify user creation in database

**2. Paystack Payment:**
- Use Postman to POST to `/payments/paystack/initiate`
- Copy the `authorization_url` and open in browser
- Use Paystack test card: `4084084084084081`
- Check transaction status

### Paystack Test Cards
- **Success:** `4084084084084081`
  - CVV: `408`
  - PIN: `0000`
  - OTP: `123456`
- **Decline:** `4084080000000408`

### Example cURL Commands

**Initiate Payment:**
```bash
curl -X POST http://localhost:4000/payments/paystack/initiate \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "email": "test@example.com"}'
```

**Check Status:**
```bash
curl "http://localhost:4000/payments/txn_1234567890_abc/status?refresh=true"
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_HOST` | PostgreSQL host |
| `DATABASE_PORT` | PostgreSQL port |
| `DATABASE_USER` | Database username |
| `DATABASE_PASSWORD` | Database password |
| `DATABASE_NAME` | Database name |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | OAuth redirect URI |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `PAYSTACK_WEBHOOK_SECRET` | Webhook signature secret |
| `PORT` | Application port |
| `NODE_ENV` | Environment (development/production) |

## Project Structure

```
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── dto/
│       └── google-user.dto.ts
├── payments/
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   ├── payments.module.ts
│   └── dto/
│       └── initiate-payment.dto.ts
├── users/
│   ├── entities/
│   │   └── user.entity.ts
│   ├── users.service.ts
│   └── users.module.ts
├── transactions/
│   ├── entities/
│   │   └── transaction.entity.ts
│   ├── transactions.service.ts
│   └── transactions.module.ts
├── app.module.ts
└── main.ts
```

<img width="1326" height="512" alt="Screenshot 2025-12-06 143404" src="https://github.com/user-attachments/assets/04bdad0b-6d85-4a76-abae-c59cfba2e0dc" />

<img width="1242" height="512" alt="Screenshot 2025-12-06 143418" src="https://github.com/user-at<img width="1353" height="641" alt="Screenshot 2025-12-06 143320" src="https://github.com/user-attachments/assets/1dc47deb-0b59-409c-a6a8-fa5acf6444d5" />
<img width="1094" height="536" alt="Screenshot 2025-12-06 143925" src="https://github.com/user-attachments/assets/ca0ded8f-da83-49a5-82bf-11aecba9bfc9" />
<img width="1351" height="613" alt="Screenshot 2025-12-06 143336" src="https://github.com/user-attachments/assets/2bbf63e1-cfd2-4146-b7f4-d1587ab99260" />
tachments/assets/15d0a9aa-dff0-4fa1-aea0-f20d076a1664" />


## Author

**Paul Yusuf** - HNG Stage 8 Backend Task

## License

MIT
