# Nivaari

Modern civic safety platform built on Next.js App Router with MongoDB-backed authentication and shadcn UI components.

## Getting started

```bash
npm install
npm run dev
```

## Build & run

```bash
npm run build
npm start
```

## Environment variables

Create a `.env.local` file and add the following keys:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Base URL of the deployed app (e.g. `https://nivaari.vercel.app`) |
| `MONGODB_URI` | Connection string for your MongoDB cluster |
| `MONGODB_DB` | Database name (defaults to `nivaari` if omitted) |
| `JWT_SECRET` | Secret string used to sign session tokens |
| `SMTP_HOST` | SMTP host used for transactional email |
| `SMTP_PORT` | SMTP port (e.g. `465` or `587`) |
| `EMAIL_USER` | SMTP username / from address |
| `EMAIL_PASS` | SMTP password or app-specific password |

Optional:

| Variable | Description |
| --- | --- |
| `APP_URL` | Alternate app URL used when `NEXT_PUBLIC_APP_URL` is unavailable |

## Deployment (Vercel)

1. Import the repository in Vercel and choose the **Next.js** preset.
2. Add the environment variables above to the project settings.
3. Build command: `next build`
4. Output directory: `.next`

## Tech stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- MongoDB
- shadcn/ui + Tailwind CSS
- Nodemailer for transactional email

## Roles and default admin

- Roles supported: `citizen`, `admin`, `supervisor`.
- Citizens can sign up via the public signup page.
- Admin and supervisor accounts are created by privileged flows (invites or seeding).
- A default admin is auto-seeded if missing:
	- Name: Shahiil Shet
	- Email: shahiilshet@gmail.com
	- Password: shahiil@142
	- Role: admin


