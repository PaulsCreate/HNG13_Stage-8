## HNG Stage 7 - Google OAuth & Paystack Payment Integration

A NestJS backend application implementing Google Sign-In and Paystack payment functionalities.

## Features

✅ Google OAuth 2.0 authentication
✅ Paystack payment initialization
✅ Webhook handling for payment status updates
✅ Transaction status verification
✅ PostgreSQL database with TypeORM
✅ Idempotency for duplicate transactions
Tech Stack
Framework: NestJS
Database: PostgreSQL
ORM: TypeORM
Authentication: Google OAuth 2.0
Payment: Paystack
Language: TypeScript
Prerequisites
Node.js (v16 or higher)
PostgreSQL
Google OAuth credentials
Paystack account
Installation
Clone the repository
bash
git clone <your-repo-url>
cd hng-stage7-auth-payment
Install dependencies
bash
npm install
Create .env file
env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=hng_stage7

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret

PORT=3000
NODE_ENV=development
Create PostgreSQL database
bash
createdb hng_stage7
Run the application
bash
npm run start:dev
API Endpoints
Authentication

1. Trigger Google Sign-In
   GET /auth/google
   Redirects to Google OAuth consent page.

2. Google OAuth Callback
   GET /auth/google/callback?code=<authorization_code>
   Handles the OAuth callback and creates/updates user.

Response:

json
{
"user_id": "uuid",
"email": "user@example.com",
"name": "John Doe",
"picture": "https://..."
}
Payments 3. Initiate Payment
POST /payments/paystack/initiate
Request Body:

json
{
"amount": 5000,
"email": "customer@example.com"
}
Response:

json
{
"reference": "txn_1234567890_abc",
"authorization_url": "https://checkout.paystack.com/..."
} 4. Webhook Endpoint
POST /payments/paystack/webhook
Receives payment status updates from Paystack. Validates signature automatically.

5. Check Transaction Status
   GET /payments/:reference/status?refresh=true
   Response:

json
{
"reference": "txn_1234567890_abc",
"status": "success",
"amount": 5000,
"paid_at": "2024-12-06T10:30:00.000Z"
}

## Webhook Testing

The webhook endpoint is implemented and validates Paystack signatures.

For local testing, the `/payments/:reference/status?refresh=true` endpoint
can be used to verify transactions directly with Paystack's API.

For production webhook testing with Paystack callbacks, expose the webhook
endpoint using a tool like ngrok.

## Database Schema

Users Table
id (UUID, Primary Key)
email (Unique)
name
picture
googleId (Unique)
createdAt
updatedAt
Transactions Table
id (UUID, Primary Key)
reference (Unique)
amount (BigInt)
status (Enum: pending, success, failed)
authorizationUrl
paidAt
userId (Foreign Key)
createdAt
updatedAt
Security Features
Environment variables for sensitive data
Webhook signature verification
Idempotency for duplicate transactions
Input validation using class-validator
Testing
Manual Testing with Postman
Google OAuth:
Open browser: http://localhost:3000/auth/google
Complete Google login
Verify user creation in database
Paystack Payment:
Use Postman to POST to /payments/paystack/initiate
Copy the authorization_url and open in browser
Use Paystack test card: 4084084084084081
Check transaction status
Paystack Test Cards
Success: 4084084084084081
Decline: 4084080000000408
Error Handling
All endpoints return appropriate HTTP status codes:

200 - Success
201 - Created
400 - Bad Request
401 - Unauthorized
404 - Not Found
500 - Internal Server Error
Environment Variables
Variable Description
DATABASE_HOST PostgreSQL host
DATABASE_PORT PostgreSQL port
DATABASE_USER Database username
DATABASE_PASSWORD Database password
DATABASE_NAME Database name
GOOGLE_CLIENT_ID Google OAuth Client ID
GOOGLE_CLIENT_SECRET Google OAuth Client Secret
GOOGLE_CALLBACK_URL OAuth redirect URI
PAYSTACK_SECRET_KEY Paystack secret key
PAYSTACK_WEBHOOK_SECRET Webhook signature secret
PORT Application port
NODE_ENV Environment (development/production)

## Project Structure

src/
├── auth/
│ ├── auth.controller.ts
│ ├── auth.service.ts
│ ├── auth.module.ts
│ └── dto/
│ └── google-user.dto.ts
├── payments/
│ ├── payments.controller.ts
│ ├── payments.service.ts
│ ├── payments.module.ts
│ └── dto/
│ └── initiate-payment.dto.ts
├── users/
│ ├── entities/
│ │ └── user.entity.ts
│ ├── users.service.ts
│ └── users.module.ts
├── transactions/
│ ├── entities/
│ │ └── transaction.entity.ts
│ ├── transactions.service.ts
│ └── transactions.module.ts
├── app.module.ts
└── main.ts

Author
Paul Yusuf - HNG Stage 7 Backend Task

License
MIT
