// src/components/dashboard/AIHealthStatus.jsx
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { Brain, ChevronRight } from "lucide-react";

export default function AIHealthStatus({ status }) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  if (!status) return null;

  const { status: statusText, summary } = status;

  const getStatusColor = () => {
    if (statusText === "Good" || statusText === "ভালো") return "text-green-600 bg-green-100";
    if (statusText === "Attention" || statusText === "মনোযোগ দিন") return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getStatusEmoji = () => {
    if (statusText === "Good" || statusText === "ভালো") return "🟢";
    if (statusText === "Attention" || statusText === "মনোযোগ দিন") return "🟡";
    return "🔴";
  };

  const getStatusLabel = () => {
    if (language === "bn") {
      if (statusText === "Good") return "ভালো";
      if (statusText === "Attention") return "মনোযোগ প্রয়োজন";
      return "সতর্কতা";
    }
    return statusText;
  };


  const handleViewDetails = () => {
    navigate("/daily-tracker");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl ${getStatusColor()} flex items-center justify-center text-2xl flex-shrink-0`}>
          {getStatusEmoji()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-800 text-sm">{t.aiHealthStatus || "AI Health Status"}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor()} font-medium ml-auto`}>
              {getStatusLabel()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{summary}</p>
          {/* View Details Button - এখন কাজ করবে */}
          <button
            onClick={handleViewDetails}
            className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {t.viewDetails || "View Details"} <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}