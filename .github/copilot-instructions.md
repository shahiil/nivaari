# Nivaari - Civic Emergency Management Platform

Nivaari is a React/TypeScript web application for civic emergency reporting and management. It includes Firebase authentication, real-time maps with Leaflet, and role-based access for citizens, admins, and supervisors.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Prerequisites and Setup
- Node.js v20+ and npm v10+ are required and available
- Firebase configuration is provided via environment variables in `.env`
- Repository uses Vite for build tooling with React SWC plugin

### Bootstrap, Build, and Test Commands
Run these commands in order for a fresh repository setup:

1. **Install Dependencies**: 
   ```bash
   npm install
   ```
   - Takes ~42 seconds, downloads 490+ packages
   - May show 4-7 moderate/low security vulnerabilities (normal for dev dependencies)
   - Optionally run `npm audit fix` to address fixable vulnerabilities

2. **Development Server**:
   ```bash
   npm run dev
   ```
   - Starts in ~410ms on http://localhost:8080
   - Includes hot-reload, React DevTools support
   - **CRITICAL**: Application fully loads and is functional - test by navigating to pages

3. **Build Application**:
   ```bash
   npm run build
   ```
   - **TIMING**: Takes ~6.8 seconds. NEVER CANCEL. Set timeout to 30+ minutes for safety
   - Creates production build in `dist/` directory
   - Build output includes ~928KB JavaScript bundle with code splitting warnings (normal)

4. **Development Build**:
   ```bash
   npm run build:dev
   ```
   - **TIMING**: Takes ~7 seconds. NEVER CANCEL. Set timeout to 30+ minutes for safety
   - Creates development build with larger bundle (~1.1MB) for debugging

5. **Preview Production Build**:
   ```bash
   npm run preview
   ```
   - Serves built application on http://localhost:4173
   - Use this to test production build locally

6. **Linting**:
   ```bash
   npm run lint
   ```
   - Takes ~2.4 seconds, runs ESLint on all TypeScript/TSX files
   - **CRITICAL**: Currently shows 17 errors, 9 warnings - this is expected
   - Main issues: @ts-ignore usage, empty interfaces, missing dependencies in hooks
   - **ALWAYS** run `npm run lint` before committing to catch new issues

## Application Architecture and Validation

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components + Tailwind CSS
- **State**: React Context + TanStack Query
- **Auth**: Firebase Authentication with role-based access
- **Database**: Firebase Firestore
- **Maps**: Leaflet with React-Leaflet
- **Routing**: React Router v6 with protected routes

### Manual Validation Scenarios
After making changes, **ALWAYS** validate these critical user flows:

1. **Homepage Load**:
   - Navigate to http://localhost:8080 (dev) or http://localhost:4173 (preview)
   - Verify hero section loads with "Stay Informed. Stay Safe." heading
   - Check navigation bar shows "Nivaari" branding and "Home" link
   - Confirm "Live City Map" and "Report an Issue" buttons are visible

2. **Authentication Flow**:
   - Click "Live City Map" or "Report an Issue" → should redirect to `/login`
   - Navigate to `/signup` → form should show Full Name, Email, Password, Confirm Password fields
   - Navigate between `/login` and `/signup` using form links
   - **Note**: Actual login requires Firebase authentication - test UI only

3. **Route Protection**:
   - Verify unauthenticated access to `/report`, `/citizen-dashboard`, `/admin-dashboard` redirects to login
   - Verify public routes work: `/`, `/login`, `/signup`

### Key File Locations
- **Main App**: `src/App.tsx` (routing and providers setup)
- **Authentication**: `src/contexts/AuthContext.tsx` + `src/firebase.js`
- **Pages**: `src/pages/` (HomePage, LoginPage, SignupPage, dashboards)
- **Components**: `src/components/` (UI components, maps, navigation)
- **UI Components**: `src/components/ui/` (shadcn/ui components)
- **Styles**: `src/index.css` (global styles + Tailwind)
- **Configuration**: `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`

### Common Development Tasks

#### Adding New Routes
1. Create page component in `src/pages/`
2. Add route to `src/App.tsx` Routes section
3. Wrap with `<PrivateRoute>` if authentication required
4. **Always** add before the catch-all `*` route

#### Working with Authentication
- Users have roles: `citizen`, `admin`, `supervisor`
- Protected routes use `<PrivateRoute role="roleName">` wrapper
- Firebase config loaded from environment variables
- Current auth context provides user state and login/logout functions

#### Styling and Components
- Uses Tailwind CSS with custom theme colors (saffron, indigo, peacock)
- shadcn/ui components configured in `components.json`
- Path aliases: `@/` maps to `./src/`
- Custom colors defined in `tailwind.config.ts`

#### Map Functionality
- Uses Leaflet maps with React-Leaflet
- Map components: `AlertsMap.tsx`, `MapView.tsx`, `LocationPicker.tsx`, `ZoneDrawingMap.tsx`
- CSS imported from CDN in `index.html`
- **Note**: Some @ts-ignore warnings in map components are expected

## Troubleshooting

### Build Issues
- If build fails, ensure Node.js v20+ is installed
- Clean build: `rm -rf node_modules package-lock.json && npm install`
- Dist folder is gitignored - regenerate with `npm run build`

### Development Server Issues  
- Default port 8080 (dev) and 4173 (preview)
- Hot reload should work automatically
- If Vite connection issues, restart dev server

### Linting Issues
- Current codebase has known linting issues - focus only on new code
- Main patterns to avoid: `@ts-ignore` (use `@ts-expect-error`), `any` types
- Fast refresh warnings in UI components are expected

### Firebase Integration
- Requires environment variables in `.env` file
- May show connection errors in browser console (normal without internet access)
- Authentication state managed in `AuthContext.tsx`

## Common File Outputs

### Repository Root Structure
```
.
├── README.md
├── package.json
├── vite.config.ts
├── tailwind.config.ts  
├── tsconfig.json
├── eslint.config.js
├── components.json
├── index.html
├── src/
├── public/
├── dist/           (build output)
├── .env            (environment variables)
└── .github/
```

### Key Package.json Scripts
```json
{
  "dev": "vite",                    // Development server
  "build": "vite build",            // Production build  
  "build:dev": "vite build --mode development",  // Dev build
  "lint": "eslint .",               // Lint TypeScript files
  "preview": "vite preview"         // Preview production build
}
```

### Build Timing Expectations
- **npm install**: ~42 seconds
- **npm run dev**: ~410ms startup  
- **npm run build**: ~6.8 seconds
- **npm run build:dev**: ~7 seconds  
- **npm run lint**: ~2.4 seconds
- **npm run preview**: ~instant startup

**CRITICAL REMINDER**: NEVER CANCEL BUILD COMMANDS. Always set timeouts of 30+ minutes for build operations even though they complete quickly. This ensures reliability for slower systems or network conditions.