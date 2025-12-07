#!/bin/bash
echo "Checking if all required files exist:"
echo ""

check_file() {
    if [ -f "$1" ]; then
        echo "✓ $1"
    else
        echo "✗ $1 - MISSING!"
    fi
}

check_file "src/entities/user.entity.ts"
check_file "src/entities/transaction.entity.ts"
check_file "src/payments/payments.service.ts"
check_file "src/payments/paystack.service.ts"
check_file "src/payments/payments.module.ts"
check_file "src/payments/payments.controller.ts"
check_file "src/auth/auth.module.ts"
check_file "src/auth/auth.service.ts"
check_file "src/auth/auth.controller.ts"
check_file "src/auth/strategies/google.strategy.ts"
check_file "src/auth/strategies/jwt.strategy.ts"
check_file "src/app.module.ts"
check_file "src/main.ts"
