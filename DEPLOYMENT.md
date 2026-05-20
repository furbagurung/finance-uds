# Finance UDS Deployment Notes

## Project path

/var/www/finance-uds

## Required environment variables

DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=

## Build commands

npm install
npx prisma db push
npx prisma db seed
npm run build

## PM2 commands

pm2 start ecosystem.config.cjs
pm2 save
pm2 restart finance-uds

## Upload folder

public/uploads/receipts

Make sure this folder exists on VPS.
