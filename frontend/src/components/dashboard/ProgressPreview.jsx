// src/components/dashboard/ProgressPreview.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { ChevronRight, Droplet, Activity } from "lucide-react";

export default function ProgressPreview({ hbTrend, symptomTrend }) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("hb");
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const tabs = [
    { id: "hb", label: t.hbTrend || "HB Trend", icon: Droplet, path: "/hb-tracker" },
    { id: "symptom", label: t.symptomTrend || "Symptom Trend", icon: Activity, path: "/daily-tracker" },
  ];

  //  Get current tab's destination
  const getCurrentPath = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab?.path || "/hb-tracker";
  };

  //  Get current tab label
  const getCurrentLabel = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab?.label || "Tracker";
  };

  const getChartData = () => {
    if (activeTab === "hb") {
      return hbTrend || [];
    }
    return symptomTrend || [];
  };

  const data = getChartData();

  const getMaxValue = () => {
    if (activeTab === "hb") {
      const values = data.map((item) => item.hb).filter((v) => v !== null && v !== undefined && v > 0);
      return values.length > 0 ? Math.max(...values) * 1.2 : 18;
    }
    const values = data.map((item) => item.score).filter((v) => v !== null && v !== undefined);
    return values.length > 0 ? Math.max(...values) * 1.2 : 10;
  };

  const maxValue = getMaxValue();

  const getBarColorClass = (value) => {
    if (activeTab === "hb") {
      if (value >= 12 && value <= 18) return "bg-green-500";
      if (value >= 10 && value < 12) return "bg-yellow-500";
      if (value < 10) return "bg-red-500";
      return "bg-blue-500";
    }
    return "bg-purple-500";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString(
      language === "bn" ? "bn-BD" : "en-US",
      { day: "numeric", month: "short" }
    );
  };

  //  Handle View Full click
  const handleViewFull = () => {
    const path = getCurrentPath();
    navigate(path);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          {activeTab === "hb" ? (
            <Droplet size={16} className="text-blue-500" />
          ) : (
            <Activity size={16} className="text-purple-500" />
          )}
          {t.healthProgress || "Health Progress"}
        </h3>
        {/*  View Full Button - Context Aware */}
        <button
          onClick={handleViewFull}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group"
        >
          {t.viewFull || "View Full"} 
          <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          <span className="text-[9px] text-gray-400 font-normal ml-0.5">
            ({getCurrentLabel()})
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-gray-100 rounded-xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                isActive
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-48 flex items-end gap-1.5 pt-2">
        {data.length === 0 ? (
          <div className="text-center w-full">
            <p className="text-xs text-gray-400">
              {activeTab === "hb" 
                ? (t.noHBData || "No HB data available. Complete a screening.")
                : (t.noDataAvailable || "No data available")}
            </p>
            {activeTab === "hb" && (
              <button
                onClick={() => navigate("/lab")}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {t.startScreening || "Start Screening →"}
              </button>
            )}
          </div>
        ) : (
          data.slice(-10).map((item, index) => {
            const value = activeTab === "hb" ? item?.hb : item?.score;
            const numericValue = typeof value === 'number' ? value : 0;
            const heightPercentage = maxValue > 0 ? (numericValue / maxValue) * 100 : 0;
            const label = formatDate(item?.date);
            const displayValue = numericValue > 0 ? numericValue.toFixed(1) : "0";
            const delay = index * 30;

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[9px] font-medium text-gray-600">
                  {displayValue}
                </span>
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ease-out ${getBarColorClass(numericValue)}`}
                  style={{
                    height: animate ? `${Math.max(heightPercentage, 3)}%` : "0%",
                    transitionDelay: `${delay}ms`,
                  }}
                />
                <span className="text-[7px] text-gray-400 truncate w-full text-center">
                  {label}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      {data.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap justify-between items-center gap-1">
          <div className="flex items-center gap-2 text-[9px] text-gray-400">
            <span>
              {activeTab === "hb" 
                ? (t.normalRange || "Normal: 12-18 g/dL")
                : (t.symptomRange || "Range: 0-10")}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {data.length} {t.days || "days"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px]">
            <span className="text-gray-400">{t.current || "Current"}:</span>
            <span className="font-medium text-gray-700">
              {activeTab === "hb" 
                ? `${data[data.length - 1]?.hb || "--"} g/dL`
                : `${data[data.length - 1]?.score || "--"} / 10`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}