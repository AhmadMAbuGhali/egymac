/** Robust JSON.parse wrapper — never throws */

export function safeJsonParse(raw, fallback = null) {
  try {
    if (raw == null || raw === "") return fallback;
    if (typeof raw !== "string") return raw;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function safeSessionStorageGet(key, fallback = null) {
  try {
    return safeJsonParse(sessionStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

export function safeSessionStorageSet(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
