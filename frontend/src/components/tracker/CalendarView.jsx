// src/components/tracker/CalendarView.jsx
import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { X, Calendar, Activity, FileText, Trash2, Loader2 } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";
import { getStatus } from "../../hooks/useTracker";

export default function CalendarView({
  data,
  onDateClick,
  selectedDate,
  selectedLog,
  showModal,
  setShowModal,
  onDelete,
  isDeleting,
}) {
  const { t, language } = useLanguage();

  if (!data) return null;

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];
  const monthName = now.toLocaleDateString(
    language === "bn" ? "bn-BD" : "en-US",
    { month: "long" }
  );

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const dayData = data[dateStr];
    const isToday = dateStr === todayStr;
    const hasLog = !!dayData;
    let bgColor = "bg-gray-50 hover:bg-gray-100";
    if (isToday) bgColor = "bg-blue-50 hover:bg-blue-100 ring-2 ring-blue-500 ring-offset-1";
    if (hasLog && dayData) {
      if (dayData.color === "green") bgColor = "bg-green-100 hover:bg-green-200";
      else if (dayData.color === "yellow") bgColor = "bg-yellow-100 hover:bg-yellow-200";
      else if (dayData.color === "red") bgColor = "bg-red-100 hover:bg-red-200";
    }
    cells.push({ day: i, date: dateStr, data: dayData, isToday, hasLog, bgColor });
  }

  // ─── Symptom Labels ───
  const symptomLabels = {
    fatigue: language === "bn" ? "ক্লান্তি" : "Fatigue",
    dizziness: language === "bn" ? "মাথা ঘোরা" : "Dizziness",
    swelling: language === "bn" ? "ফোলাভাব" : "Swelling",
    breathless: language === "bn" ? "শ্বাসকষ্ট" : "Breathlessness",
    heartbeat: language === "bn" ? "বুক ধড়ফড়" : "Heart Palpitations",
    headache: language === "bn" ? "মাথাব্যথা" : "Headache",
    pale_eyes: language === "bn" ? "চোখ ফ্যাকাশে" : "Pale Eyes",
    concentration: language === "bn" ? "মনোযোগ সমস্যা" : "Concentration Issues",
  };

  const severityLabels = {
    0: language === "bn" ? "নেই" : "None",
    1: language === "bn" ? "হালকা" : "Mild",
    2: language === "bn" ? "মাঝারি" : "Moderate",
    3: language === "bn" ? "তীব্র" : "Severe",
  };

  const severityColors = {
    0: "bg-green-100 text-green-700",
    1: "bg-yellow-100 text-yellow-700",
    2: "bg-orange-100 text-orange-700",
    3: "bg-red-100 text-red-700",
  };

  return (
    <>
      {/* ─── Calendar ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 text-sm mb-4">
          {t.calendar || "Calendar"} - {monthName} {now.getFullYear()}
        </h3>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">{t.good || "Good"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-gray-600">{t.attention || "Attention"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-600">{t.warning || "Warning"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300"></span>
            <span className="text-gray-600">{t.noLog || "No Log"}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
          {cells.map((cell, idx) => {
            if (!cell) return <div key={idx} className="text-center py-2 text-xs text-gray-300">•</div>;
            return (
              <div
                key={idx}
                onClick={() => cell.hasLog && onDateClick(cell.date)}
                className={`text-center py-2 rounded-lg text-sm cursor-pointer ${cell.bgColor} ${
                  cell.hasLog ? "hover:scale-105 transition-transform" : "cursor-default"
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className={`text-xs font-medium ${cell.isToday ? "text-blue-600" : "text-gray-700"}`}>
                    {cell.day}
                  </span>
                  {cell.hasLog && <span className="text-xs">{cell.data?.emoji || "✅"}</span>}
                  {!cell.hasLog && !cell.isToday && <span className="text-xs text-gray-300">·</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Modal ─── */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" />
                <h3 className="text-lg font-bold text-gray-800">
                  {new Date(selectedDate).toLocaleDateString(
                    language === "bn" ? "bn-BD" : "en-US",
                    { weekday: "long", day: "numeric", month: "long", year: "numeric" }
                  )}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">
                    {t.symptomScore || "Symptom Score"}:
                  </span>
                  <span className="text-lg font-bold">{selectedLog.score || 0} / 10</span>
                </div>
                <StatusBadge status={getStatus(selectedLog.score || 0)} />
              </div>

              {selectedLog.note && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-gray-600">{t.note || "Note"}:</p>
                  <p className="text-sm text-gray-700">{selectedLog.note}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <FileText size={14} /> {t.symptoms || "Symptoms"}:
                </p>
                <div className="space-y-1.5">
                  {Object.entries(selectedLog.symptoms || {}).map(([id, value]) => {
                    if (value === 0) return null;
                    return (
                      <div key={id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5">
                        <span className="text-sm text-gray-700">{symptomLabels[id] || id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${severityColors[value]}`}>
                          {severityLabels[value] || value}
                        </span>
                      </div>
                    );
                  })}
                  {Object.values(selectedLog.symptoms || {}).every(v => v === 0) && (
                    <p className="text-sm text-gray-400 italic">{t.noSymptoms || "No symptoms reported"}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  onDelete(selectedDate);
                }}
                disabled={isDeleting}
                className="w-full mt-2 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {t.delete || "Delete"}
              </button>
            </div>

            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
              >
                {t.close || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}