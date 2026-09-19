// src/components/tracker/AIInsight.jsx
import { useLanguage } from "../../hooks/useLanguage";
import { Brain, CheckCircle, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";

export default function AIInsight({ advice, analysis }) {
  const { t, language } = useLanguage();

  if (!advice) return null;

  // ─── 0. Extract Active Language Data Safely ───
  // backend returns root data + localized 'bn'/'en' keys
  const langKey = language === "en" ? "en" : "bn";
  const localizedData = advice[langKey] || advice;

  // ─── 1. STATUS BADGE MAPPER ───
  const getStatusInfo = () => {
    const rawStatus = (
      localizedData.status_key || 
      advice.status_key || 
      advice.status || 
      "good"
    ).toLowerCase();

    const map = {
      good: { 
        label: language === "bn" ? "ভালো" : "Good", 
        color: "text-green-700 bg-green-100 border-green-200",
        emoji: "🟢"
      },
      attention: { 
        label: language === "bn" ? "মনোযোগ প্রয়োজন" : "Attention Needed", 
        color: "text-yellow-700 bg-yellow-100 border-yellow-200",
        emoji: "🟡"
      },
      warning: { 
        label: language === "bn" ? "সতর্কতা" : "Warning", 
        color: "text-red-700 bg-red-100 border-red-200",
        emoji: "🔴"
      },
      critical: { 
        label: language === "bn" ? "জরুরি সতর্কতা" : "Critical Warning", 
        color: "text-red-800 bg-red-200 border-red-300",
        emoji: "🚨"
      }
    };

    return map[rawStatus] || map.good;
  };

  // ─── 2. RECOMMENDATIONS PARSER ───
  const getRecommendations = () => {
    const recs = localizedData.advice || advice.advice || advice.recommendations;

    if (Array.isArray(recs) && recs.length > 0) {
      return recs;
    }
    
    return [
      language === "bn" ? "নিয়মিত লক্ষণ লগ করুন।" : "Log your symptoms regularly.",
      language === "bn" ? "পর্যাপ্ত পানি পান করুন ও বিশ্রামে থাকুন।" : "Drink enough water and rest well.",
      language === "bn" ? "প্রয়োজনে নিবন্ধিত চিকিৎসকের পরামর্শ নিন।" : "Consult a registered doctor if needed."
    ];
  };

  // ─── 3. TREND ICON & LABEL HELPER ───
  const renderTrendInfo = () => {
    if (!analysis || analysis.lastScore === null || analysis.lastScore === undefined) return null;

    const trend = analysis.trend;
    const diff = analysis.trendDiff;

    if (trend === "worsening") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-md border border-red-100">
          <TrendingUp size={14} />
          {language === "bn" ? `স্কোর বেড়েছে (+${diff})` : `Score increased (+${diff})`}
        </span>
      );
    }
    if (trend === "improving") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md border border-green-100">
          <TrendingDown size={14} />
          {language === "bn" ? `স্কোর কমেছে (-${Math.abs(diff)})` : `Score decreased (-${Math.abs(diff)})`}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
        <Minus size={14} />
        {language === "bn" ? "অবস্থা স্থিতিশীল" : "Condition stable"}
      </span>
    );
  };

  const statusInfo = getStatusInfo();
  const recommendations = getRecommendations();
  const summaryText = localizedData.summary || advice.summary;
  const medicalReasons = localizedData.medical_reasons || advice.medical_reasons || [];

  return (
    <div className="space-y-4">
      
      {/* ─── STATUS BADGE & TREND ─── */}
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
          <span>{statusInfo.emoji}</span>
          {statusInfo.label}
        </div>

        {/* Trend Info Badge */}
        {renderTrendInfo()}
      </div>

      {/* ─── AI SUMMARY BOX ─── */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={18} className="text-purple-600" />
          <h3 className="font-semibold text-gray-800 text-sm">
            {t.aiSummary || (language === "bn" ? "এআই বিশ্লেষণ" : "AI Summary")}
          </h3>
        </div>
        
        <p className="text-sm text-gray-700 leading-relaxed font-normal">
          {summaryText || (language === "bn" ? "কোনো বিশ্লেষণ পাওয়া যায়নি।" : "No summary available.")}
        </p>

        {/* ─── Medical Reasons Tag (If exists) ─── */}
        {Array.isArray(medicalReasons) && medicalReasons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-purple-700 font-medium flex items-center gap-1">
              <AlertCircle size={12} />
              {language === "bn" ? "প্রধান কারণ:" : "Key Factors:"}
            </span>
            {medicalReasons.map((reason, idx) => (
              <span key={idx} className="text-[11px] bg-purple-100/80 text-purple-800 px-2 py-0.5 rounded-md font-medium">
                {reason}
              </span>
            ))}
          </div>
        )}
        
        {/* Previous Score Footer */}
        {analysis?.lastScore !== null && analysis?.lastScore !== undefined && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-purple-100 text-xs text-gray-500">
            <span>
              {t.lastLog || (language === "bn" ? "পূর্ববর্তী স্কোর" : "Last Log")}: <strong>{analysis.lastScore}/10</strong>
            </span>
            {analysis.lastLogDate && (
              <span>{analysis.lastLogDate}</span>
            )}
          </div>
        )}
      </div>

      {/* ─── RECOMMENDATIONS BOX ─── */}
      <div className="bg-blue-50/70 rounded-2xl border border-blue-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
          <CheckCircle size={18} className="text-blue-600" />
          {t.recommendation || (language === "bn" ? "পরামর্শ ও করণীয়" : "Recommendation")}
        </h3>
        <ul className="space-y-2">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="text-blue-500 font-bold mt-0.5">✓</span>
              <span className="leading-snug">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}