// src/components/dashboard/HealthOverview.jsx
import { useLanguage } from "../../hooks/useLanguage";
import { Droplet, Shield, Activity, Flame } from "lucide-react";

export default function HealthOverview({ data }) {
  const { t, language } = useLanguage();

  if (!data) return null;

  const { hb, riskLevel, symptomScore, streak, riskColor } = data;

  const getRiskText = () => {
    if (language === "bn") {
      if (riskLevel === "Severe") return "মারাত্মক";
      if (riskLevel === "Moderate") return "মাঝারি";
      if (riskLevel === "Mild") return "হালকা";
      return "স্বাভাবিক";
    }
    return riskLevel;
  };

  const getRiskColorClass = () => {
    if (riskColor === "red") return "text-red-600 bg-red-100";
    if (riskColor === "orange") return "text-orange-600 bg-orange-100";
    if (riskColor === "yellow") return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  //  Symptom Level - Fix: null/0 হলে "Low" দেখাবে
  const getSymptomLevel = () => {
    if (symptomScore === null || symptomScore === 0) {
      return language === "bn" ? "কম" : "Low";
    }
    if (symptomScore <= 3) return language === "bn" ? "কম" : "Low";
    if (symptomScore <= 6) return language === "bn" ? "মাঝারি" : "Medium";
    return language === "bn" ? "উচ্চ" : "High";
  };

  const getSymptomColor = () => {
    if (symptomScore === null || symptomScore === 0) return "text-green-600 bg-green-100";
    if (symptomScore <= 3) return "text-green-600 bg-green-100";
    if (symptomScore <= 6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const cards = [
    {
      id: "hb",
      icon: Droplet,
      label: t.currentHB || "Current HB",
      value: hb !== null ? `${hb} g/dL` : "--",
      sub: hb !== null ? (hb >= 12 ? "✓ Normal" : " Low") : "",
      color: hb !== null && hb >= 12 ? "text-blue-600 bg-blue-100" : "text-red-600 bg-red-100",
    },
    {
      id: "risk",
      icon: Shield,
      label: t.riskLevel || "Risk Level",
      value: getRiskText(),
      sub: riskLevel !== "Normal" ? " " + (language === "bn" ? "মনোযোগ" : "Attention") : "🟢 " + (language === "bn" ? "স্বাভাবিক" : "Normal"),
      color: getRiskColorClass(),
    },
    {
      id: "symptom",
      icon: Activity,
      label: t.todaySymptom || "Today's Symptom",
      value: symptomScore !== null ? `${symptomScore} / 10` : "--",
      sub: getSymptomLevel(),
      color: getSymptomColor(),
    },
    {
      id: "streak",
      icon: Flame,
      label: t.currentStreak || "Current Streak",
      value: `${streak} ${t.days || "Days"}`,
      sub: " " + (language === "bn" ? "ধারাবাহিক" : "Consistent"),
      color: "text-orange-600 bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-xl ${card.color} flex items-center justify-center`}>
                <Icon size={16} />
              </div>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
            <p className="text-xl font-bold text-gray-800">{card.value}</p>
            <p className={`text-xs font-medium ${card.color.split(" ")[0]}`}>{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}