// src/components/dashboard/HealthTip.jsx
import { useLanguage } from "../../hooks/useLanguage";
import { Lightbulb } from "lucide-react";

export default function HealthTip({ tip }) {
  const { t } = useLanguage();

  if (!tip) return null;

  return (
    <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Lightbulb size={16} className="text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-blue-700">{t.dailyTip || "Daily Health Tip"}</p>
          <p className="text-sm text-gray-700 mt-0.5">{tip}</p>
        </div>
      </div>
    </div>
  );
}