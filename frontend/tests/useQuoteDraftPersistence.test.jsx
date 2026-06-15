import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useQuoteDraftPersistence,
  draftStorageKey,
  draftPromptKey,
  getRestorableDraft,
  markDraftPromptHandled,
  discardDraftSession,
  isDraftPromptDismissed,
} from "../src/hooks/useQuoteDraftPersistence.js";

const baseQuote = {
  clientName: "Test Client",
  referenceNumber: "REF-001",
};

describe("useQuoteDraftPersistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it("persists draft to sessionStorage on interval (15s)", () => {
    const { rerender } = renderHook(
      (props) => useQuoteDraftPersistence(props),
      {
        initialProps: {
          quote: baseQuote,
          sectionVisibility: { signatures: true },
          templateStyle: "standard",
          visualAttachments: [],
          savedId: null,
          dirty: true,
        },
      }
    );

    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    const stored = sessionStorage.getItem(draftStorageKey(null));
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored);
    expect(parsed.quote.clientName).toBe("Test Client");
    expect(parsed.templateStyle).toBe("standard");

    rerender({
      quote: { ...baseQuote, clientName: "Updated Client" },
      sectionVisibility: { signatures: true },
      templateStyle: "replica",
      visualAttachments: [],
      savedId: null,
      dirty: true,
    });

    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    const updated = JSON.parse(sessionStorage.getItem(draftStorageKey(null)));
    expect(updated.quote.clientName).toBe("Updated Client");
    expect(updated.templateStyle).toBe("replica");
  });

  it("does not persist when dirty is false", () => {
    renderHook(() =>
      useQuoteDraftPersistence({
        quote: baseQuote,
        sectionVisibility: {},
        templateStyle: "standard",
        visualAttachments: [],
        savedId: null,
        dirty: false,
      })
    );

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(sessionStorage.getItem(draftStorageKey(null))).toBeNull();
  });

  it("restoreDraft returns parsed payload or null on malformed data", () => {
    sessionStorage.setItem(draftStorageKey("5"), "{not-valid-json");

    const { result } = renderHook(() =>
      useQuoteDraftPersistence({
        quote: baseQuote,
        sectionVisibility: {},
        templateStyle: "standard",
        visualAttachments: [],
        savedId: "5",
        dirty: true,
      })
    );

    expect(result.current.restoreDraft()).toBeNull();
  });

  it("clearDraft removes storage entry", () => {
    sessionStorage.setItem(
      draftStorageKey("9"),
      JSON.stringify({ quote: baseQuote, ts: Date.now() })
    );

    const { result } = renderHook(() =>
      useQuoteDraftPersistence({
        quote: baseQuote,
        sectionVisibility: {},
        templateStyle: "standard",
        visualAttachments: [],
        savedId: "9",
        dirty: true,
      })
    );

    act(() => {
      result.current.clearDraft();
    });

    expect(sessionStorage.getItem(draftStorageKey("9"))).toBeNull();
    expect(sessionStorage.getItem(draftPromptKey("9"))).toBe("true");
  });

  it("registers beforeunload handler when dirty", () => {
    const addSpy = vi.spyOn(window, "addEventListener");

    renderHook(() =>
      useQuoteDraftPersistence({
        quote: baseQuote,
        sectionVisibility: {},
        templateStyle: "standard",
        visualAttachments: [],
        savedId: null,
        dirty: true,
      })
    );

    expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    addSpy.mockRestore();
  });

  it("beforeunload persists draft and sets returnValue", () => {
    let handler;
    vi.spyOn(window, "addEventListener").mockImplementation((event, fn) => {
      if (event === "beforeunload") handler = fn;
    });

    renderHook(() =>
      useQuoteDraftPersistence({
        quote: baseQuote,
        sectionVisibility: {},
        templateStyle: "standard",
        visualAttachments: [],
        savedId: null,
        dirty: true,
      })
    );

    const event = { preventDefault: vi.fn(), returnValue: undefined };
    act(() => {
      handler(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.returnValue).toBe("");
    expect(sessionStorage.getItem(draftStorageKey(null))).toBeTruthy();
  });
});

describe("draft restore prompt session flags", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("getRestorableDraft returns null after prompt was handled", () => {
    sessionStorage.setItem(
      draftStorageKey(null),
      JSON.stringify({ quote: baseQuote, ts: Date.now() })
    );
    markDraftPromptHandled(null);
    expect(getRestorableDraft(null)).toBeNull();
  });

  it("discardDraftSession removes draft and marks prompt dismissed", () => {
    sessionStorage.setItem(
      draftStorageKey(null),
      JSON.stringify({ quote: baseQuote, ts: Date.now() })
    );
    discardDraftSession(null);
    expect(sessionStorage.getItem(draftStorageKey(null))).toBeNull();
    expect(isDraftPromptDismissed(null)).toBe(true);
    expect(getRestorableDraft(null)).toBeNull();
  });

  it("getRestorableDraft skips expired drafts", () => {
    sessionStorage.setItem(
      draftStorageKey(null),
      JSON.stringify({ quote: baseQuote, ts: Date.now() - 300 * 60_000 })
    );
    expect(getRestorableDraft(null, 240)).toBeNull();
  });
});
