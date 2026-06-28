/** Shared API root — must match `client.js` and Vite proxy in dev. */
export const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.PROD ? "/_/backend/api" : "/api");
