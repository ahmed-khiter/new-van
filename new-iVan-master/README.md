# Installation
1. Clone the repository

2. Install dependencies

```
cd folder_name
npm install
```

3. Configure environment variables
- In the root create .env file and configure the following variables

Create a database into mysql
```
DATABASE_URL=

GITHUB_ID=
GITHUB_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_ID=
GOOGLE_SECRET=


NEXT_PUBLIC_LOCALE_DETECTION=false


MAILTRAP_HOST=
MAILTRAP_PORT=
MAILTRAP_USER=
MAILTRAP_PASS=

Strip

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

4. Run the application

```
npm run dev

```



5. Run the build

```
npm run build
```

6. Migration
```
npx prisma migrate dev --name init
```

docker-compose -f docker-compose-prisma.yaml up 

7. Seeder

```
npm run seed
```

pm2 list

pm2 stop next-subsc-app

pm2 delete next-subsc-app

npm run build 

pm2 start npm --name "next-subsc-app" -- run live 

pm2 logs next-subsc-app 

npx prisma generate
