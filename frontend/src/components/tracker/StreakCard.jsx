// src/components/tracker/StreakCard.jsx
import { useLanguage } from "../../hooks/useLanguage";
import { Flame } from "lucide-react";

export default function StreakCard({ streak }) {
  const { t } = useLanguage();

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-6 text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <Flame size={32} className="text-orange-500" />
        <span className="text-4xl font-bold text-orange-600">{streak}</span>
      </div>
      <p className="text-sm text-gray-700">
        {t.streakDays || "You've logged symptoms for"}{" "}
        <span className="font-bold text-orange-600">{streak}</span>{" "}
        {t.consecutiveDays || "consecutive days."}
      </p>
    </div>
  );
}