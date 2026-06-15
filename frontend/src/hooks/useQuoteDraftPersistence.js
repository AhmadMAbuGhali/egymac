import { useEffect, useRef, useCallback } from "react";
import { safeSessionStorageGet, safeSessionStorageSet } from "../utils/safeJson.js";

const DRAFT_PREFIX = "egymac_quote_draft_v1";
const PROMPT_DISMISSED_PREFIX = "egymac_quote_draft_prompt_dismissed_v1";
const DEFAULT_MAX_AGE_MINUTES = 240;

export function draftStorageKey(savedId) {
  return `${DRAFT_PREFIX}:${savedId ?? "new"}`;
}

export function draftPromptKey(savedId) {
  return `${PROMPT_DISMISSED_PREFIX}:${savedId ?? "new"}`;
}

export function isDraftPromptDismissed(savedId) {
  try {
    return sessionStorage.getItem(draftPromptKey(savedId)) === "true";
  } catch {
    return false;
  }
}

/** Mark prompt handled — call when dialog is shown or user chooses restore/discard */
export function markDraftPromptHandled(savedId) {
  try {
    sessionStorage.setItem(draftPromptKey(savedId), "true");
  } catch {
    /* private mode / quota */
  }
}

/** Read draft payload if prompt not yet handled and draft is still fresh */
export function getRestorableDraft(savedId, maxAgeMinutes = DEFAULT_MAX_AGE_MINUTES) {
  if (isDraftPromptDismissed(savedId)) return null;

  const draft = safeSessionStorageGet(draftStorageKey(savedId), null);
  if (!draft?.quote) return null;

  const ageMin = (Date.now() - (draft.ts || 0)) / 60_000;
  if (ageMin > maxAgeMinutes) return null;

  return draft;
}

/** Purge draft data and ensure restore prompt never fires again this session */
export function discardDraftSession(savedId) {
  markDraftPromptHandled(savedId);
  try {
    sessionStorage.removeItem(draftStorageKey(savedId));
  } catch {
    /* ignore */
  }
}

/**
 * Session-scoped autosave + beforeunload guard for the quote builder.
 * Restore prompt logic lives in FreeFormQuoteGenerator mount-only effect
 * using getRestorableDraft / markDraftPromptHandled / discardDraftSession.
 */
export function useQuoteDraftPersistence({
  quote,
  sectionVisibility,
  templateStyle,
  visualAttachments,
  savedId,
  dirty = true,
}) {
  const persist = useCallback(() => {
    if (!dirty) return;
    const payload = {
      quote,
      sectionVisibility,
      templateStyle,
      visualAttachments,
      savedId,
      ts: Date.now(),
    };
    safeSessionStorageSet(draftStorageKey(savedId), payload);
  }, [quote, sectionVisibility, templateStyle, visualAttachments, savedId, dirty]);

  useEffect(() => {
    const id = setInterval(persist, 15_000);
    return () => clearInterval(id);
  }, [persist]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirty) return;
      persist();
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, persist]);

  const restoreDraft = useCallback(() => {
    return safeSessionStorageGet(draftStorageKey(savedId), null);
  }, [savedId]);

  const clearDraft = useCallback(() => {
    discardDraftSession(savedId);
  }, [savedId]);

  return { restoreDraft, clearDraft, persistDraft: persist };
}
