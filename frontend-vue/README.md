# NEXORA Vue Frontend

A compact Vue 3 + Tailwind CSS storefront for the existing NEXORA FastAPI and PostgreSQL application.

## Stack
- Vue 3 and TypeScript
- Vite
- Tailwind CSS 4
- Existing Python FastAPI API
- Existing PostgreSQL database

## Run locally

1. Install Node.js 20 or newer.
2. From this directory, install packages:

   ```sh
   npm install
   ```

3. Copy `.env.example` to `.env` and set `VITE_API_URL` to the FastAPI URL (default: `http://localhost:8000`).
4. Start the development server:

   ```sh
   npm run dev
   ```

5. Create a production build:

   ```sh
   npm run build
   ```

## Current scope

- Fetches products from `GET /products?size=100`.
- Search and category filtering.
- Responsive product grid.
- Session-only shopping bag with quantity controls.
- Loading, API-error, empty, and out-of-stock states.
- No animations.

Authentication, persistent cart synchronization, checkout, wishlist, order history, and admin tools are not part of this simplified first version. The existing Next.js frontend is retained unchanged while this Vue frontend is evaluated; switch the active frontend only after the required flows have been migrated and tested.
