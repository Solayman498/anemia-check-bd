import { useLanguage } from "../../hooks/useLanguage";
import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function AIWeeklySummary({ data }) {
  const { t, language } = useLanguage();

  if (!data) return null;

  const { summary, trend, changes } = data;

  const getTrendIcon = (change) => {
    if (change === "improved") return <TrendingUp size={14} className="text-green-500" />;
    if (change === "worsened") return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-yellow-500" />;
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
      <div className="flex items-center gap-2 mb-3">
        <Brain size={18} className="text-indigo-600" />
        <h3 className="font-semibold text-gray-800 text-sm">
          {t.aiWeeklySummary || "AI Weekly Summary"}
        </h3>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">
          {t.overallTrend || "Overall Trend:"}
        </span>
        <span className={`text-sm font-semibold ${
          trend === "Improving" ? "text-green-600" : trend === "Worsening" ? "text-red-600" : "text-yellow-600"
        }`}>
          {trend === "Improving" ? "↑ Improving" : trend === "Worsening" ? "↓ Worsening" : "→ Stable"}
        </span>
      </div>
      {changes && (
        <div className="mt-3 space-y-1.5">
          {Object.entries(changes).map(([symptom, change]) => (
            <div key={symptom} className="flex items-center gap-2 text-sm text-gray-600">
              {getTrendIcon(change)}
              <span>
                {symptom}: {change === "improved" ? t.decreased || "decreased" : change === "worsened" ? t.increased || "increased" : t.unchanged || "unchanged"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}