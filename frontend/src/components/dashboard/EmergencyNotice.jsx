// src/components/dashboard/EmergencyNotice.jsx
import { useLanguage } from "../../hooks/useLanguage";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EmergencyNotice() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  return (
    <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={20} className="text-red-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-red-800 text-sm">
            {t.emergencyNotice || "⚠️ Please consult a doctor"}
          </h4>
          <p className="text-sm text-red-700 mt-1 leading-relaxed">
            {t.emergencyMessage || "Your recent reports indicate that medical evaluation is recommended."}
          </p>
          <button
            onClick={() => navigate("/history")}
            className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
          >
            {t.viewReports || "View Reports"} <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}