// src/components/tracker/TrackerHeader.jsx
import { useLanguage } from "../../hooks/useLanguage";
import { StatusBadge } from "../ui/StatusBadge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function TrackerHeader({ status, score, lastLog, trend, trendDiff }) {
  const { t, language } = useLanguage();

  // ─── Trend Resolution Logic ───
  let trendText = language === "bn" ? "স্থিতিশীল" : "Stable";
  let trendColor = "text-blue-200";
  let IconComponent = Minus;

  // Determine trend by trend string or numeric difference
  const isImproving = trend === "improving" || (trendDiff !== null && trendDiff !== undefined && trendDiff < -0.5);
  const isWorsening = trend === "worsening" || (trendDiff !== null && trendDiff !== undefined && trendDiff > 0.5);

  if (isImproving) {
    // লক্ষণ/স্কোর কমা = স্বাস্থ্য অবস্থার উন্নতি
    trendText = language === "bn" ? "উন্নতি" : "Improved";
    trendColor = "text-emerald-300";
    IconComponent = TrendingDown;
  } else if (isWorsening) {
    // লক্ষণ/স্কোর বাড়া = স্বাস্থ্য অবস্থার অবনতি
    trendText = language === "bn" ? "অবনতি" : "Worsened";
    trendColor = "text-rose-300";
    IconComponent = TrendingUp;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Status */}
        <div>
          <p className="text-blue-200 text-xs uppercase tracking-wider font-medium">
            {language === "bn" ? "অবস্থা" : "Status"}
          </p>
          <div className="mt-1">
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Current Score */}
        <div>
          <p className="text-blue-200 text-xs uppercase tracking-wider font-medium">
            {language === "bn" ? "বর্তমান স্কোর" : "Score"}
          </p>
          <p className="text-2xl font-bold mt-1">
            {score !== undefined && score !== null ? `${score} / 10` : "--"}
          </p>
        </div>

        {/* Last Log Score */}
        <div>
          <p className="text-blue-200 text-xs uppercase tracking-wider font-medium">
            {language === "bn" ? "পূর্ববর্তী স্কোর" : "Last Log"}
          </p>
          <p className="text-2xl font-bold mt-1">
            {lastLog !== null && lastLog !== undefined ? `${lastLog} / 10` : "--"}
          </p>
        </div>

        {/* Trend Indicator */}
        <div>
          <p className="text-blue-200 text-xs uppercase tracking-wider font-medium">
            {language === "bn" ? "ট্রেন্ড" : "Trend"}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <IconComponent className={`w-5 h-5 ${trendColor}`} />
            <span className={`text-lg font-bold ${trendColor}`}>
              {trendText}
            </span>
            {trendDiff !== null && trendDiff !== undefined && (
              <span className="text-xs text-blue-200 font-normal ml-0.5">
                ({trendDiff > 0 ? `+${trendDiff.toFixed(1)}` : trendDiff.toFixed(1)})
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}