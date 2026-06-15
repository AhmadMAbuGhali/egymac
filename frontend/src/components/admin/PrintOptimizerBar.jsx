import { FileStack, Minimize2 } from "lucide-react";

export const PRINT_MODE_COMPACT = "compact";
export const PRINT_MODE_SPANNED = "spanned";

const ACTIVE_STYLE = {
  backgroundColor: "#3b767c",
  color: "#ffffff",
};

export default function PrintOptimizerBar({ mode, onChange }) {
  return (
    <div className="no-print print-optimizer-bar mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: "#3b767c" }}
          >
            Smart Print Optimizer
          </p>
          <p className="text-xs text-ink-muted mt-0.5">
            Tune layout density before canvas PDF export
          </p>
        </div>
        <div
          className="inline-flex rounded-xl border border-accent/40 bg-surface p-1 gap-1 shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
          role="group"
          aria-label="Print optimization mode"
        >
          <button
            type="button"
            onClick={() => onChange(PRINT_MODE_COMPACT)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ease-out active:scale-95 hover:bg-accent-light/60"
            style={mode === PRINT_MODE_COMPACT ? ACTIVE_STYLE : undefined}
          >
            <Minimize2 size={14} />
            1 Page · Compact
          </button>
          <button
            type="button"
            onClick={() => onChange(PRINT_MODE_SPANNED)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ease-out active:scale-95 hover:bg-accent-light/60"
            style={mode === PRINT_MODE_SPANNED ? ACTIVE_STYLE : undefined}
          >
            <FileStack size={14} />
            Multi-Page · Spanned
          </button>
        </div>
      </div>
    </div>
  );
}
