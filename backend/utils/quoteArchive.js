import { readJson, writeJson, nextId, mutateJson } from "./jsonStore.js";
import { computeQuoteTotalAmount } from "./quoteTotalAmount.js";
import { filterArchiveRows } from "../../shared/archiveFilters.js";

const ARCHIVE_FILE = "archived_quotes.json";
const SAVED_FILE = "saved_quotes.json";

export function buildArchiveRecord(quote) {
  const now = new Date().toISOString();
  return {
    id: quote.id,
    clientName: quote.clientName || "",
    date: quote.archivedAt || quote.savedAt || now,
    totalAmount: computeQuoteTotalAmount(quote),
    salespersonId: quote.salespersonId ?? null,
    referenceNumber: quote.referenceNumber || "",
    payload: quote,
  };
}

export async function upsertArchivedQuote(quote) {
  const record = buildArchiveRecord(quote);
  await mutateJson(ARCHIVE_FILE, [], (rows) => {
    const list = Array.isArray(rows) ? [...rows] : [];
    const idx = list.findIndex((r) => String(r.id) === String(record.id));
    if (idx === -1) {
      list.push(record);
    } else {
      list[idx] = { ...list[idx], ...record, date: record.date };
    }
    return list;
  });
  return record;
}

export async function listArchivedQuotes(filters = {}) {
  await migrateSavedQuotesToArchive();
  const rows = await readJson(ARCHIVE_FILE, []);
  return filterArchiveRows(rows, filters);
}

export async function getArchivedQuoteById(id) {
  const rows = await readJson(ARCHIVE_FILE, []);
  return rows.find((r) => String(r.id) === String(id)) || null;
}

export async function deleteArchivedQuote(id) {
  await mutateJson(ARCHIVE_FILE, [], (rows) =>
    (Array.isArray(rows) ? rows : []).filter((r) => String(r.id) !== String(id))
  );
}

export async function deleteSavedQuote(id) {
  await mutateJson(SAVED_FILE, [], (rows) =>
    (Array.isArray(rows) ? rows : []).filter((q) => String(q.id) !== String(id))
  );
}

/** One-time sync from legacy saved_quotes.json into archived_quotes.json */
export async function migrateSavedQuotesToArchive() {
  const saved = await readJson(SAVED_FILE, []);
  const archived = await readJson(ARCHIVE_FILE, []);
  if (!saved.length) return;

  const archivedIds = new Set(archived.map((r) => String(r.id)));
  const missing = saved.filter((q) => !archivedIds.has(String(q.id)));
  if (!missing.length) return;

  const merged = [
    ...archived,
    ...missing.map((q) => buildArchiveRecord(q)),
  ];
  await writeJson(ARCHIVE_FILE, merged);
}

export { ARCHIVE_FILE, SAVED_FILE };
