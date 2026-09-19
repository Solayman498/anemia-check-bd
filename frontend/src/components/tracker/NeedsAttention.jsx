// src/components/tracker/NeedsAttention.jsx
import { useLanguage } from "../../hooks/useLanguage";
import { AlertTriangle } from "lucide-react";

export default function NeedsAttention({ data }) {
  const { t } = useLanguage();

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={18} className="text-red-600" />
        <h3 className="font-semibold text-red-800 text-sm">{t.needsAttention || "Needs Attention"}</h3>
      </div>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.id} className="bg-white rounded-lg p-3 border border-red-100">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800">{item.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                item.severity === "high" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
              }`}>
                {item.severity === "high" ? t.high || "High" : t.medium || "Medium"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t.last5DaysIncreasing || "Last 5 days increasing"} - ⚠ {t.monitorClosely || "Monitor closely"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}