import { AsyncLocalStorage } from "async_hooks";

/** Per-request OIDC token from Vercel (Express may not populate @vercel/request-context). */
export const requestOidcStorage = new AsyncLocalStorage();

export function getRequestOidcToken() {
  return requestOidcStorage.getStore()?.oidcToken || null;
}

export function oidcContextMiddleware(req, _res, next) {
  const oidcToken = req.headers["x-vercel-oidc-token"];
  if (typeof oidcToken === "string" && oidcToken.length > 0) {
    requestOidcStorage.run({ oidcToken }, next);
  } else {
    next();
  }
}
