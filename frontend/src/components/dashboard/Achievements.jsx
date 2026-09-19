// src/components/dashboard/Achievements.jsx
import { useLanguage } from "../../hooks/useLanguage";
import { Award, Flame, TrendingUp } from "lucide-react";

export default function Achievements({ data }) {
  const { t } = useLanguage();

  if (!data) return null;

  const { totalLogs, streak, hbImproved } = data;

  const items = [
    {
      id: "logs",
      icon: Award,
      label: t.healthLogs || "Health Logs",
      value: totalLogs,
      sub: t.completed || "Completed",
      color: "text-blue-600 bg-blue-100",
    },
    {
      id: "streak",
      icon: Flame,
      label: t.streak || "Streak",
      value: `${streak} ${t.days || "Days"}`,
      sub: t.consistent || "Consistent",
      color: "text-orange-600 bg-orange-100",
    },
    {
      id: "hb",
      icon: TrendingUp,
      label: t.hbImproved || "HB Trend",
      value: hbImproved !== 0 ? `+${hbImproved} g/dL` : "--",
      sub: hbImproved !== 0 ? (hbImproved > 0 ? t.improved || "Improved" : t.decreased || "Decreased") : t.noChange || "No Change",
      color: hbImproved > 0 ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100",
    },
  ];

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
      <h3 className="font-semibold text-gray-800 text-sm mb-4">
        🏅 {t.achievements || "Achievements"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon size={18} />
              </div>
              <p className="text-lg font-bold text-gray-800">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-xs text-gray-400">{item.sub}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}