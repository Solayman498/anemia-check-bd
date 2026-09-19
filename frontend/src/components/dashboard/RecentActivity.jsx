// src/components/dashboard/RecentActivity.jsx
import { useLanguage } from "../../hooks/useLanguage";
import { Clock, CheckCircle } from "lucide-react";

export default function RecentActivity({ activities }) {
  const { t, language } = useLanguage();

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (language === "bn") {
      if (minutes < 1) return "এইমাত্র";
      if (minutes < 60) return `${minutes} মিনিট আগে`;
      if (hours < 24) return `${hours} ঘন্টা আগে`;
      if (days < 7) return `${days} দিন আগে`;
      return `${Math.floor(days / 7)} সপ্তাহ আগে`;
    }
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  if (!activities || activities.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 text-sm mb-4">
        {t.recentActivity || "Recent Activity"}
      </h3>
      <div className="space-y-3">
        {activities.slice(0, 5).map((activity, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-lg">{activity.icon || "📝"}</span>
              <div>
                <p className="text-sm font-medium text-gray-700">{activity.title}</p>
                <p className="text-xs text-gray-400">{getTimeAgo(activity.date)}</p>
              </div>
            </div>
            <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}