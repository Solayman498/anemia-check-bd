// src/pages/Settings.jsx
import { useNavigate } from "react-router-dom";
import { User, Globe, ChevronRight } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

function Settings() {
  const navigate = useNavigate();
  const { t, toggleLanguage, language } = useLanguage();

  const settingsOptions = [
    {
      id: "profile",
      icon: User,
      label: t.profileUpdate,
      description: t.profileUpdateDesc,
      onClick: () => navigate("/profile-setup")  // . Profile Setup-এ পাঠাবে
    },
    {
      id: "language",
      icon: Globe,
      label: t.language,
      description: t.languageDesc,
      onClick: toggleLanguage
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-lg">{t.settingsTitle}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t.settingsDescription}</p>
        </div>

        <div className="divide-y divide-gray-100">
          {settingsOptions.map((option) => {
            const Icon = option.icon;
            const isLanguage = option.id === "language";
            
            return (
              <button
                key={option.id}
                onClick={option.onClick}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Icon size={20} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isLanguage && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      language === "bn" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {language === "bn" ? "বাংলা" : "English"}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 transition" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-base">ℹ️</span>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">{t.languageChange}</p>
            <p className="text-xs text-blue-600 mt-0.5">
              {language === "bn" ? t.currentLanguage : t.currentLanguageEn}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;