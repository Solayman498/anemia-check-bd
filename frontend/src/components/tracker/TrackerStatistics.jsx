// src/components/tracker/TrackerStatistics.jsx
import { useLanguage } from "../../hooks/useLanguage";
import { ClipboardList, Flame, Activity, Calendar as CalendarIcon } from "lucide-react";

export default function TrackerStatistics({ data }) {
  const { t, language } = useLanguage();

  if (!data) return null;

  const { totalLogs = 0, streak = 0, avgScore = 0, lastLogDate } = data;

  // ─── Helper to format numbers based on selected language ───
  const formatNumber = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "--";
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US").format(val);
  };

  // ─── Safe Date Formatter ───
  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    try {
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) return "--";
      return parsedDate.toLocaleDateString(
        language === "bn" ? "bn-BD" : "en-US",
        { day: "numeric", month: "short" }
      );
    } catch {
      return "--";
    }
  };

  // ─── Dynamic Color for Average Score ───
  const numAvg = Number(avgScore) || 0;
  let avgScoreColor = "text-emerald-600";
  if (numAvg >= 6) {
    avgScoreColor = "text-rose-600";
  } else if (numAvg >= 3.5) {
    avgScoreColor = "text-amber-600";
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 shadow-sm">
      <h3 className="font-semibold text-gray-800 text-sm mb-4">
        {t.trackingStatistics || (language === "bn" ? "ট্র্যাকিং পরিসংখ্যান" : "Tracking Statistics")}
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Logs */}
        <div className="text-center bg-white rounded-xl p-3 shadow-sm border border-gray-100/80">
          <ClipboardList size={20} className="text-blue-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500 font-medium">
            {t.totalLogs || (language === "bn" ? "মোট এন্ট্রি" : "Total Logs")}
          </p>
          <p className="text-xl font-bold text-gray-800 mt-0.5">
            {formatNumber(totalLogs)}
          </p>
        </div>

        {/* Current Streak */}
        <div className="text-center bg-white rounded-xl p-3 shadow-sm border border-gray-100/80">
          <Flame size={20} className="text-orange-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500 font-medium">
            {t.currentStreak || (language === "bn" ? "ধারাবাহিকতা (Streak)" : "Current Streak")}
          </p>
          <p className="text-xl font-bold text-orange-600 mt-0.5">
            {formatNumber(streak)} {language === "bn" ? "দিন" : "days"}
          </p>
        </div>

        {/* Average Score */}
        <div className="text-center bg-white rounded-xl p-3 shadow-sm border border-gray-100/80">
          <Activity size={20} className="text-indigo-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500 font-medium">
            {t.avgScore || (language === "bn" ? "গড় স্কোর" : "Avg. Score")}
          </p>
          <p className={`text-xl font-bold ${avgScoreColor} mt-0.5`}>
            {formatNumber(numAvg.toFixed(1))}
          </p>
        </div>

        {/* Last Log Date */}
        <div className="text-center bg-white rounded-xl p-3 shadow-sm border border-gray-100/80">
          <CalendarIcon size={20} className="text-purple-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500 font-medium">
            {t.lastLog || (language === "bn" ? "সর্বশেষ লগের তারিখ" : "Last Log")}
          </p>
          <p className="text-sm font-bold text-gray-800 mt-1">
            {formatDate(lastLogDate)}
          </p>
        </div>

      </div>
    </div>
  );
}