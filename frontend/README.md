# Daylight frontend

This frontend uses the existing FastAPI todo API without requiring backend changes. During development, Vite proxies requests from `/api` to the backend, avoiding the need for backend CORS configuration.

## Run locally

1. Start the backend from the `backend` directory:

   ```sh
   uvicorn app.main:app --reload
   ```

2. In another terminal, start the frontend from this directory:

   ```sh
   npm install
   npm run dev
   ```

   Open the local URL printed by Vite.

If the backend runs somewhere other than `http://127.0.0.1:8000`, set `BACKEND_URL` for the Vite process. In production, configure your hosting platform to proxy `/api` to the backend and keep the default API base. Alternatively, set `VITE_API_BASE_URL` at build time to a URL that the browser can access; a cross-origin backend URL also needs CORS configured outside this backend.
