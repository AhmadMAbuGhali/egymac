import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Archive,
  Calendar,
  User,
  FileSpreadsheet,
  Plus,
  Filter,
  X,
} from "lucide-react";
import { getSavedQuotes, deleteSavedQuote, getSalespersons } from "../../api/client.js";
import SalespersonManager, { SalespersonManagerTrigger } from "./SalespersonManager.jsx";
import "../../styles/archiveWorkspace.css";

function formatRelativeDate(iso) {
  if (!iso) return { relative: "—", absolute: "" };
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    let relative;
    if (diffMins < 1) relative = "الآن";
    else if (diffMins < 60) relative = `منذ ${diffMins} د`;
    else if (diffHours < 24) relative = `منذ ${diffHours} س`;
    else if (diffDays < 7) relative = `منذ ${diffDays} ي`;
    else {
      relative = date.toLocaleDateString("ar-EG", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    const absolute = date.toLocaleDateString("ar-EG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return { relative, absolute };
  } catch {
    return { relative: iso, absolute: "" };
  }
}

function formatAmountBadge(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toLocaleString("ar-EG");
}

export default function ArchivedQuotesList({
  adminKey,
  onEdit,
  onCreateNew,
  refreshToken = 0,
}) {
  const [rows, setRows] = useState([]);
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ salespersonId: "", startDate: "", endDate: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtersActive = useMemo(
    () => Boolean(filters.salespersonId || filters.startDate || filters.endDate),
    [filters]
  );

  const loadSalespersons = useCallback(async () => {
    if (!adminKey) return;
    try {
      const res = await getSalespersons(adminKey);
      setSalespersons(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSalespersons([]);
    }
  }, [adminKey]);

  const loadRows = useCallback(async ({ silent = false } = {}) => {
    if (!adminKey) return;
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await getSavedQuotes(adminKey, {
        salespersonId: filters.salespersonId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.message || "تعذر تحميل الأرشيف.");
      if (!silent) setRows([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [adminKey, filters]);

  useEffect(() => {
    loadSalespersons();
  }, [loadSalespersons]);

  useEffect(() => {
    loadRows();
  }, [loadRows, refreshToken]);

  const clearFilters = () => {
    setFilters({ salespersonId: "", startDate: "", endDate: "" });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const deletedId = deleteTarget.id;
    setDeleting(true);
    setError("");
    try {
      await deleteSavedQuote(deletedId, adminKey);
      setDeleteTarget(null);
      setRows((prev) => prev.filter((row) => String(row.id) !== String(deletedId)));
    } catch (e) {
      setError(e.message || "تعذر حذف العرض.");
      await loadRows({ silent: true });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="archive-workspace">
      {/* ── Header ── */}
      <header className="archive-page-header">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#3b767c]/10 text-[#3b767c]">
                <Archive size={22} aria-hidden />
              </span>
              <div>
                <h2 className="archive-page-title">أرشيف عروض الأسعار</h2>
                <p className="archive-page-subtitle">
                  إدارة العروض المحفوظة — عرض، تعديل، أو حذف نهائي
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SalespersonManagerTrigger
              onClick={() => setDrawerOpen(true)}
              count={salespersons.length}
            />
            <button
              type="button"
              onClick={loadRows}
              disabled={loading}
              className="archive-toolbar-btn archive-toolbar-btn--ghost disabled:opacity-60 disabled:pointer-events-none transition-all duration-200"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              تحديث
            </button>
          </div>
        </div>
      </header>

      {/* ── Floating filter dock ── */}
      <section className="archive-filter-dock" aria-label="تصفية الأرشيف">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter size={16} className="text-[#3b767c]" aria-hidden />
            <span className="archive-filter-dock__label mb-0">تصفية النتائج</span>
            {rows.length > 0 && !loading && (
              <span className="archive-count-badge">{rows.length}</span>
            )}
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className={`archive-filter-clear ${filtersActive ? "archive-filter-clear--visible" : ""}`}
          >
            <X size={14} />
            مسح الفلاتر
          </button>
        </div>

        <div className="archive-filter-grid">
          <div className="archive-filter-field">
            <User size={16} className="archive-filter-field__icon" aria-hidden />
            <select
              id="filter-sp"
              value={filters.salespersonId}
              onChange={(e) => setFilters((f) => ({ ...f, salespersonId: e.target.value }))}
              aria-label="مسؤول البيع"
            >
              <option value="">كل مسؤولي البيع</option>
              {salespersons.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="archive-filter-field">
            <Calendar size={16} className="archive-filter-field__icon" aria-hidden />
            <input
              id="filter-start"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
              aria-label="من تاريخ"
            />
          </div>

          <div className="archive-filter-field">
            <Calendar size={16} className="archive-filter-field__icon" aria-hidden />
            <input
              id="filter-end"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
              aria-label="إلى تاريخ"
            />
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="archive-toolbar-btn archive-toolbar-btn--ghost w-full justify-center sm:w-auto"
            >
              <User size={16} />
              إضافة مسؤول بيع
            </button>
          </div>
        </div>
      </section>

      {error && (
        <p
          className="text-red-600 text-sm mb-4 bg-red-50 rounded-xl px-4 py-3 leading-relaxed"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* ── Data matrix ── */}
      <div className="archive-matrix-card">
        {loading ? (
          <div className="archive-loading-row">
            <Loader2 size={20} className="animate-spin text-[#3b767c]" />
            جاري تحميل الأرشيف…
          </div>
        ) : rows.length === 0 ? (
          <div className="archive-empty-state">
            <div className="archive-empty-icon">
              <FileSpreadsheet size={36} strokeWidth={1.5} aria-hidden />
            </div>
            <h3 className="archive-empty-title">
              {filtersActive ? "لا توجد نتائج مطابقة" : "الأرشيف فارغ"}
            </h3>
            <p className="archive-empty-desc">
              {filtersActive
                ? "جرّب تعديل معايير التصفية أو مسح الفلاتر لعرض جميع العروض."
                : "ابدأ بإنشاء أول عرض سعر واحفظه — سيظهر هنا تلقائياً مع كل التفاصيل."}
            </p>
            {filtersActive ? (
              <button type="button" onClick={clearFilters} className="archive-toolbar-btn archive-toolbar-btn--ghost">
                <X size={16} />
                مسح الفلاتر
              </button>
            ) : (
              <button type="button" onClick={onCreateNew} className="archive-empty-cta">
                <Plus size={18} />
                إنشاء عرض سعر جديد
              </button>
            )}
          </div>
        ) : (
          <table className="archive-matrix-table">
            <thead>
              <tr>
                <th>المعرّف</th>
                <th>العميل</th>
                <th>التاريخ</th>
                <th>إجمالي السعر</th>
                <th>مسؤول البيع</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const { relative, absolute } = formatRelativeDate(row.date);
                const amount = formatAmountBadge(row.totalAmount);

                return (
                  <tr
                    key={row.id}
                    className="archive-matrix-row group cursor-pointer"
                    onClick={() => onEdit?.(row.id)}
                  >
                    <td>
                      <span className="archive-id-badge">#{row.id}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-slate-800 leading-relaxed" dir="rtl">
                        {row.clientName || "—"}
                      </span>
                      {row.referenceNumber && (
                        <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                          {row.referenceNumber}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="archive-date-cell" title={absolute}>
                        <Calendar size={14} aria-hidden />
                        <span>{relative}</span>
                      </span>
                    </td>
                    <td>
                      {amount ? (
                        <span className="archive-price-badge">
                          {amount}
                          <span className="text-[10px] font-medium ms-1 opacity-80">ج.م</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td>
                      <span className="archive-salesperson-cell" dir="rtl">
                        {row.salespersonName ? (
                          <>
                            <User size={14} className="text-[#3b767c]/60 shrink-0" aria-hidden />
                            {row.salespersonName}
                          </>
                        ) : (
                          <span className="text-slate-400 font-normal">غير محدد</span>
                        )}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="archive-action-group">
                        <button
                          type="button"
                          onClick={() => onEdit?.(row.id)}
                          className="archive-action-btn archive-action-btn--edit"
                        >
                          <Pencil size={14} />
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="archive-action-btn archive-action-btn--delete"
                        >
                          <Trash2 size={14} />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Delete confirmation ── */}
      {deleteTarget && (
        <div className="archive-modal-backdrop" role="dialog" aria-modal="true">
          <div className="archive-modal">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 mb-4">
              <Trash2 size={22} aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2 leading-relaxed" dir="rtl">
              تأكيد الحذف
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed" dir="rtl">
              هل أنت متأكد من حذف هذا العرض نهائياً؟
              <br />
              <span className="font-semibold text-[#3b767c] mt-1 inline-block">
                {deleteTarget.clientName || `عرض #${deleteTarget.id}`}
              </span>
            </p>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="archive-toolbar-btn archive-toolbar-btn--ghost"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}

      <SalespersonManager
        adminKey={adminKey}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onRosterChange={setSalespersons}
      />
    </div>
  );
}
