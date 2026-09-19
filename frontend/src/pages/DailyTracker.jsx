// src/pages/DailyTracker.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useTracker } from "../hooks/useTracker";
import {
  TrackerHeader,
  SymptomSelector,
  SaveButton,
  AIInsight,
  SymptomTrend,
  WeeklySummary,
  StreakCard,
  CalendarView,
  FrequentSymptoms,
  TrackerStatistics,
} from "../components/tracker";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ArrowLeft, Activity, Clock, Trash2, Eye, AlertTriangle } from "lucide-react";
import { getStatus, getTodayKey } from "../hooks/useTracker";

export default function DailyTracker() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("today");

  const {
    loading,
    todayLog,
    setTodayLog,
    saveLog,
    score,
    status,
    analysis,
    aiAdvice,
    trendData,
    weeklySummary,
    streak,
    calendarData,
    frequentSymptoms,
    statistics,
    allLogs,
    isSaving,
    isSaved,
    handleDateClick,
    selectedLog,
    selectedDate,
    showHistoryModal,
    setShowHistoryModal,
    deleteLog,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
  } = useTracker();

  // Helper for safe local date parsing
  const formatLocalDate = (dateStr) => {
    if (!dateStr) return "--";
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString(
      language === "bn" ? "bn-BD" : "en-US",
      { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {t.dailyTracker || (language === "bn" ? "দৈনিক স্বাস্থ্য ট্র্যাকার" : "Daily Tracker")}
            </h1>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString(
                language === "bn" ? "bn-BD" : "en-US",
                { weekday: "long", day: "numeric", month: "long", year: "numeric" }
              )}
            </p>
          </div>
        </div>
        <Activity size={20} className="text-blue-500 animate-pulse" />
      </div>

      {/* ─── TABS ─── */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("today")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "today"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.todayLog || (language === "bn" ? "আজকের এন্ট্রি" : "Today's Log")}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.history || (language === "bn" ? "পূর্ববর্তী ইতিহাস" : "History")} ({allLogs.length})
        </button>
      </div>

      {/* ─── TODAY'S LOG TAB ─── */}
      {activeTab === "today" && (
        <div className="space-y-6">
          {/* 1. TRACKER HEADER */}
          <TrackerHeader 
            status={status} 
            score={score} 
            lastLog={analysis?.lastScore} 
            trend={analysis?.trend}
            trendDiff={analysis?.trendDiff}
          />

          {/* 2. SYMPTOMS SELECTOR */}
          <SymptomSelector symptoms={todayLog?.symptoms || {}} onChange={setTodayLog} />

          {/* 3. SAVE BUTTON */}
          <SaveButton onSave={saveLog} isSaving={isSaving} isSaved={isSaved} />

          {/* 4. AI SUMMARY + RECOMMENDATION */}
          {aiAdvice && <AIInsight advice={aiAdvice} analysis={analysis} />}

          {/* 5. SYMPTOM TREND */}
          {trendData && trendData.length > 0 && <SymptomTrend data={trendData} />}

          {/* 6. WEEKLY SUMMARY */}
          {weeklySummary && <WeeklySummary data={weeklySummary} />}

          {/* 7. STREAK */}
          {streak > 0 && <StreakCard streak={streak} />}

          {/* 8. CALENDAR */}
          <CalendarView
            data={calendarData}
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
            selectedLog={selectedLog}
            showModal={showHistoryModal}
            setShowModal={setShowHistoryModal}
            onDelete={deleteLog}
            isDeleting={isDeleting}
          />

          {/* 9. FREQUENT SYMPTOMS */}
          {frequentSymptoms && frequentSymptoms.length > 0 && (
            <FrequentSymptoms data={frequentSymptoms} />
          )}

          {/* 10. STATISTICS */}
          {statistics && <TrackerStatistics data={statistics} />}
        </div>
      )}

      {/* ─── HISTORY TAB ─── */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <Clock size={16} className="text-gray-500" />
              {t.history || (language === "bn" ? "ইতিহাস" : "History")} ({allLogs.length} {language === "bn" ? "টি এন্ট্রি" : "entries"})
            </p>
          </div>

          {allLogs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">{t.noLogs || (language === "bn" ? "কোনো এন্ট্রি পাওয়া যায়নি" : "No logs found")}</p>
              <p className="text-xs text-gray-400 mt-1">
                {language === "bn" ? "আজই আপনার স্বাস্থ্যের ট্র্যাক রাখা শুরু করুন!" : "Start tracking your health today!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {allLogs.slice().reverse().map((log) => {
                const logStatus = getStatus(log.score || 0);
                const isToday = log.date === getTodayKey();
                
                return (
                  <div key={log.date} className="px-4 py-3 hover:bg-gray-50 transition group">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 pr-2">
                        <p className="font-medium text-gray-800 text-sm flex items-center gap-2">
                          {formatLocalDate(log.date)}
                          {isToday && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                              {language === "bn" ? "আজ" : "Today"}
                            </span>
                          )}
                        </p>
                        {log.note && (
                          <p className="text-xs text-gray-500 mt-0.5 italic truncate">
                            "{log.note}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={logStatus} />
                        
                        <button
                          onClick={() => handleDateClick(log.date)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-md"
                        >
                          <Eye size={14} />
                          {t.view || (language === "bn" ? "দেখুন" : "View")}
                        </button>

                        <button
                          onClick={() => {
                            setDeleteTarget(log.date);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          title={language === "bn" ? "ডিলিট করুন" : "Delete"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-bold text-gray-800">
                {language === "bn" ? "এন্ট্রি মুছে ফেলবেন?" : "Delete Log?"}
              </h3>
            </div>
            
            <p className="text-sm text-gray-600">
              {language === "bn" 
                ? `${deleteTarget} তারিখের রেকর্ডটি চিরতরে মুছে ফেলা হবে। আপনি কি নিশ্চিত?` 
                : `Are you sure you want to delete the log for ${deleteTarget}? This action cannot be undone.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                disabled={isDeleting}
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                onClick={() => deleteLog(deleteTarget)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition flex items-center gap-1.5"
              >
                {isDeleting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {language === "bn" ? "হ্যাঁ, মুছে ফেলুন" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}