// src/components/dashboard/QuickActions.jsx
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { Plus, Calendar, Heart, History } from "lucide-react";

export default function QuickActions() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const actions = [
    { id: "new-screening", icon: Plus, label: t.newScreening || "New Screening", path: "/lab", color: "bg-blue-100 text-blue-600" },
    { id: "daily-tracker", icon: Calendar, label: t.dailyTracker || "Daily Tracker", path: "/daily-tracker", color: "bg-green-100 text-green-600" },
    { id: "hb-tracker", icon: Heart, label: t.hbTracker || "HB Tracker", path: "/hb-tracker", color: "bg-red-100 text-red-600" },
    { id: "history", icon: History, label: t.history || "History", path: "/history", color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 text-sm mb-4">
        {t.quickActions || "Quick Actions"}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
              </div>
              <p className="text-xs font-medium text-gray-700 text-center">{action.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}