# Nivaari (Next.js)

This project was migrated from Vite + React to Next.js (Pages Router) to deploy on Vercel. App logic and UI were preserved.

## Develop

- Install deps: `npm install`
- Run dev: `npm run dev`

## Build

- `npm run build`
- `npm start`

## Environment variables

Create `.env.local` and copy your values:

- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID (optional)
- NEXT_PUBLIC_APP_URL: e.g. https://nivaari.vercel.app
- FIREBASE_SERVICE_ACCOUNT_KEY: JSON string for server-side (used in /pages/api/send-invite.js)

If you had a `.env` with VITE_ variables, rename them with NEXT_PUBLIC_ and add to Vercel Project Settings -> Environment Variables.

## Deployment (Vercel)

- Import this repo in Vercel
- Framework Preset: Next.js
- Build Command: `next build`
- Output Directory: `.next`
- Environment variables: add the ones listed above

## Notes

- Static assets moved to `public/` (e.g. `/hero-bg.jpg`)
- Routing uses Next.js Pages under `pages/`
- Netlify functions moved to Next API routes under `pages/api/`# Welcome to your Nivaari project

## Project info



**Use your preferred IDE**



The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS


