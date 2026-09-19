// src/components/tracker/WeeklySummary.jsx
import { useLanguage } from "../../hooks/useLanguage";
import { Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function WeeklySummary({ data }) {
  const { t, language } = useLanguage();

  if (!data) return null;

  const { average, highest, lowest, totalDays, completedDays } = data;

  const completionPercentage = Math.round((completedDays / totalDays) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 text-sm mb-4 flex items-center gap-2">
        <Calendar size={16} className="text-blue-500" />
        {t.weeklyReport || "Weekly Report"}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">{t.logsThisWeek || "Logs This Week"}</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {completedDays} / {totalDays}
          </p>
        </div>

        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">{t.averageScore || "Average Score"}</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {average !== undefined && average !== null ? average.toFixed(1) : "--"}
          </p>
        </div>

        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">{t.highestScore || "Highest Score"}</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {highest !== undefined && highest !== null ? highest.toFixed(1) : "--"}
          </p>
        </div>

        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">{t.lowestScore || "Lowest Score"}</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {lowest !== undefined && lowest !== null ? lowest.toFixed(1) : "--"}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{t.weeklyCompletion || "Weekly Completion"}</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}