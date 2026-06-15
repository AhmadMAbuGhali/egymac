import { useState, useCallback } from "react";
import {
  createEmptyFreeFormQuote,
  createSpecRow,
  createTermRow,
  createSignature,
  normalizeFreeFormQuote,
} from "../constants/freeFormQuote.js";
import { nextRowId } from "../utils/uniqueId.js";

export function useFreeFormQuote() {
  const [quote, setQuote] = useState(createEmptyFreeFormQuote());
  const [savedId, setSavedId] = useState(null);

  const loadQuote = useCallback((data) => {
    const normalized = normalizeFreeFormQuote(data);
    setQuote(normalized);
    setSavedId(data.id ?? null);
  }, []);

  /** Load archived/template content as a new document — never overwrite source id on save. */
  const loadQuoteFork = useCallback((data) => {
    const normalized = normalizeFreeFormQuote(JSON.parse(JSON.stringify(data)));
    delete normalized.id;
    delete normalized.savedAt;
    delete normalized.archivedAt;
    normalized.referenceNumber = `EMPL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    setQuote(normalized);
    setSavedId(null);
  }, []);

  const resetQuote = useCallback(() => {
    setQuote(createEmptyFreeFormQuote());
    setSavedId(null);
  }, []);

  const updateField = useCallback((field, value) => {
    setQuote((q) => ({ ...q, [field]: value }));
  }, []);

  const updateTechColumn = useCallback((column, value) => {
    setQuote((q) => ({
      ...q,
      technicalColumns: { ...q.technicalColumns, [column]: value },
    }));
  }, []);

  const updateCommColumn = useCallback((column, value) => {
    setQuote((q) => ({
      ...q,
      commercialColumns: { ...q.commercialColumns, [column]: value },
    }));
  }, []);

  const updateFooter = useCallback((field, value) => {
    setQuote((q) => ({
      ...q,
      companyFooter: { ...q.companyFooter, [field]: value },
    }));
  }, []);

  const addFooterLine = useCallback(() => {
    setQuote((q) => ({
      ...q,
      companyFooter: {
        ...q.companyFooter,
        extraLines: [...(q.companyFooter.extraLines || []), ""],
      },
    }));
  }, []);

  const updateFooterLine = useCallback((index, value) => {
    setQuote((q) => {
      const lines = [...(q.companyFooter.extraLines || [])];
      lines[index] = value;
      return { ...q, companyFooter: { ...q.companyFooter, extraLines: lines } };
    });
  }, []);

  const removeFooterLine = useCallback((index) => {
    setQuote((q) => ({
      ...q,
      companyFooter: {
        ...q.companyFooter,
        extraLines: (q.companyFooter.extraLines || []).filter((_, i) => i !== index),
      },
    }));
  }, []);

  const updateSpec = useCallback((id, field, value) => {
    setQuote((q) => ({
      ...q,
      technicalSpecs: q.technicalSpecs.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));
  }, []);

  const addSpec = useCallback((afterIndex = null) => {
    setQuote((q) => {
      const nextId = nextRowId(q.technicalSpecs);
      const row = createSpecRow(nextId, String(nextId));
      if (afterIndex === null || afterIndex < 0) {
        return { ...q, technicalSpecs: [...q.technicalSpecs, row] };
      }
      const specs = [...q.technicalSpecs];
      specs.splice(afterIndex + 1, 0, row);
      return { ...q, technicalSpecs: specs };
    });
  }, []);

  const removeSpec = useCallback((id) => {
    setQuote((q) => {
      if (q.technicalSpecs.length <= 1) return q;
      return { ...q, technicalSpecs: q.technicalSpecs.filter((r) => r.id !== id) };
    });
  }, []);

  const updateTerm = useCallback((id, field, value) => {
    setQuote((q) => ({
      ...q,
      commercialTerms: q.commercialTerms.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));
  }, []);

  const addTerm = useCallback((afterIndex = null) => {
    setQuote((q) => {
      const nextId = nextRowId(q.commercialTerms);
      const row = createTermRow(nextId, String(nextId));
      if (afterIndex === null || afterIndex < 0) {
        return { ...q, commercialTerms: [...q.commercialTerms, row] };
      }
      const terms = [...q.commercialTerms];
      terms.splice(afterIndex + 1, 0, row);
      return { ...q, commercialTerms: terms };
    });
  }, []);

  const removeTerm = useCallback((id) => {
    setQuote((q) => {
      if (q.commercialTerms.length <= 1) return q;
      return { ...q, commercialTerms: q.commercialTerms.filter((r) => r.id !== id) };
    });
  }, []);

  const updateSignature = useCallback((id, field, value) => {
    setQuote((q) => ({
      ...q,
      signatures: q.signatures.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  }, []);

  const addSignature = useCallback(() => {
    setQuote((q) => {
      const nextId = nextRowId(q.signatures);
      return { ...q, signatures: [...q.signatures, createSignature(nextId)] };
    });
  }, []);

  const removeSignature = useCallback((id) => {
    setQuote((q) => {
      if (q.signatures.length <= 1) return q;
      return { ...q, signatures: q.signatures.filter((s) => s.id !== id) };
    });
  }, []);

  const updateGreetingPart = useCallback((part, value) => {
    setQuote((q) => {
      const lines = String(q.greeting || "").split("\n");
      const first = lines[0] || "";
      const rest = lines.slice(1).join("\n");
      if (part === "first") {
        const greeting = value ? (rest ? `${value}\n${rest}` : value) : rest;
        return { ...q, greeting };
      }
      const greeting = first ? `${first}\n${value}` : value;
      return { ...q, greeting };
    });
  }, []);

  const updateMachineryInline = useCallback((itemId, specId, field, value) => {
    setQuote((q) => ({
      ...q,
      machineryItems: (q.machineryItems || []).map((it) => {
        if (it.id !== itemId) return it;
        if (specId != null && field) {
          return {
            ...it,
            specs: (it.specs || []).map((s) =>
              s.id === specId ? { ...s, [field]: value } : s
            ),
          };
        }
        return { ...it, [field]: value };
      }),
    }));
  }, []);

  return {
    quote,
    savedId,
    setSavedId,
    loadQuote,
    loadQuoteFork,
    resetQuote,
    updateField,
    updateTechColumn,
    updateCommColumn,
    updateFooter,
    addFooterLine,
    updateFooterLine,
    removeFooterLine,
    updateSpec,
    addSpec,
    removeSpec,
    updateTerm,
    addTerm,
    removeTerm,
    updateSignature,
    addSignature,
    removeSignature,
    updateGreetingPart,
    updateMachineryInline,
  };
}
