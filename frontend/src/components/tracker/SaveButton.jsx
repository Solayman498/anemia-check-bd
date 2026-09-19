// src/components/tracker/SaveButton.jsx
import { useLanguage } from "../../hooks/useLanguage";
import { Save, CheckCircle, Loader2 } from "lucide-react";

export default function SaveButton({ onSave, isSaving, isSaved }) {
  const { t } = useLanguage();

  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
        isSaved
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isSaving ? (
        <><Loader2 size={18} className="animate-spin" /> {t.saving || "Saving..."}</>
      ) : isSaved ? (
        <><CheckCircle size={18} /> {t.saved || "Saved ✓"}</>
      ) : (
        <><Save size={18} /> {t.saveLog || "Save Today's Log"}</>
      )}
    </button>
  );
}