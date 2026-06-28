import { useEffect, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc, getDoc, setDoc, collection,
  getDocs, orderBy, query, deleteDoc
} from "firebase/firestore";
import { 
  Calendar, Activity, Target, Award, Brain,
  ArrowLeft, Clock, Trash2
} from "lucide-react";

function getBDDate() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
}

function getTodayKey() {
  const bd = getBDDate();
  return `${bd.getFullYear()}-${String(bd.getMonth()+1).padStart(2,"0")}-${String(bd.getDate()).padStart(2,"0")}`;
}

const SYMPTOM_LIST = [
  { id: "fatigue", labelBn: "ক্লান্তি", labelEn: "Fatigue" },
  { id: "dizziness", labelBn: "মাথা ঘোরা", labelEn: "Dizziness" },
  { id: "pale_skin", labelBn: "ত্বক ফ্যাকাশে", labelEn: "Pale Skin" },
  { id: "breathless", labelBn: "শ্বাসকষ্ট", labelEn: "Breathlessness" },
  { id: "heartbeat", labelBn: "বুক ধড়ফড়", labelEn: "Heart Palpitations" },
  { id: "headache", labelBn: "মাথাব্যথা", labelEn: "Headache" },
  { id: "pale_eyes", labelBn: "চোখ ফ্যাকাশে", labelEn: "Pale Eyes" },
  { id: "concentration", labelBn: "মনোযোগ সমস্যা", labelEn: "Concentration Issues" }
];

const SCALE = [
  { value: 0, labelBn: "নেই", labelEn: "None", color: "bg-green-100 text-green-700" },
  { value: 1, labelBn: "হালকা", labelEn: "Mild", color: "bg-yellow-100 text-yellow-700" },
  { value: 2, labelBn: "মাঝারি", labelEn: "Moderate", color: "bg-orange-100 text-orange-700" },
  { value: 3, labelBn: "তীব্র", labelEn: "Severe", color: "bg-red-100 text-red-700" }
];

function MiniBar({ value, max = 10, color = "bg-blue-500" }) {
  const width = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ease-out ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export default function DailyTracker() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const today = getTodayKey();

  const [profile, setProfile] = useState(null);
  const [todayLog, setTodayLog] = useState({ symptoms: {} });
  const [allLogs, setAllLogs] = useState({});
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch AI Advice function - gets BOTH languages from backend
  const fetchAIAdvice = async (uid, score, logs) => {
    try {
      const logsArray = Object.values(logs).sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      const response = await fetch("http://localhost:8000/tracker-advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score,
          logs: logsArray,
          language,
        }),
      });

      if (!response.ok) return;

      const advice = await response.json();

      await setDoc(
        doc(db, "users", uid, "tracker_advice", "latest"),
        {
          ...advice,
          updatedAt: new Date().toISOString(),
        }
      );

      setAiAdvice(advice);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const pSnap = await getDoc(doc(db, "users", uid));
        setProfile(pSnap.data());

        const logSnap = await getDoc(doc(db, "users", uid, "daily_logs", today));
        if (logSnap.exists()) setTodayLog(logSnap.data());

        const logsSnap = await getDocs(query(collection(db, "users", uid, "daily_logs"), orderBy("date", "desc")));
        const map = {};
        logsSnap.docs.forEach(d => { map[d.id] = d.data(); });
        setAllLogs(map);

        const advSnap = await getDoc(doc(db, "users", uid, "tracker_advice", "latest"));
        if (advSnap.exists()) setAiAdvice(advSnap.data());
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [today]);

  const calcScore = (syms = {}) => {
    const total = SYMPTOM_LIST.reduce((s, { id }) => s + (syms[id] || 0), 0);
    return Math.round((total / (SYMPTOM_LIST.length * 3)) * 10 * 10) / 10;
  };

  const saveLog = async () => {

    setSaving(true);

    try {

      const uid = auth.currentUser.uid;

      const score = calcScore(todayLog.symptoms);

      const logData = {
        symptoms: todayLog.symptoms,
        date: today,
        score,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "users", uid, "daily_logs", today),
        logData
      );

      const updatedLogs = {
        ...allLogs,
        [today]: logData,
      };

      setAllLogs(updatedLogs);

      setSaved(true);

      setTimeout(() => setSaved(false), 2500);

      await fetchAIAdvice(uid, score, updatedLogs);

    } catch (err) {

      console.error(err);

    }

    setSaving(false);

  };

  // Delete a specific log
  const deleteLog = async (date) => {
    if (!window.confirm(language === "bn" ? "এই লগটি ডিলিট করতে চান?" : "Delete this log?")) return;
    
    setDeleting(true);
    try {
      const uid = auth.currentUser?.uid;
      await deleteDoc(doc(db, "users", uid, "daily_logs", date));
      
      const updatedLogs = { ...allLogs };
      delete updatedLogs[date];
      setAllLogs(updatedLogs);
      
      if (date === today) {
        setTodayLog({ symptoms: {} });
      }
      
    } catch (e) {
      console.error("Error deleting log:", e);
      alert(language === "bn" ? "ডিলিট করতে সমস্যা হয়েছে" : "Failed to delete");
    }
    setDeleting(false);
  };

  const score = calcScore(todayLog.symptoms);
  const scoreColor = score <= 3 ? "text-green-600" : score <= 6 ? "text-orange-500" : "text-red-600";

  // . Get translated AI advice based on language
  const getTranslatedAdvice = () => {
    if (!aiAdvice) return null;
    
    if (aiAdvice.bn && aiAdvice.en) {
      return aiAdvice[language] || aiAdvice.bn;
    }
    
    return aiAdvice;
  };

  // . Get status color based on advice
  const getStatusColor = (advice) => {
    if (!advice) return "green";
    return advice.status_color || "green";
  };

  // . Get status text based on advice and language
  const getAdviceStatus = (advice) => {
    if (!advice) return "";
    const status = advice.status;
    if (language === "bn") return status;
    const statusMap = {
      "ভালো": "Good",
      "মনোযোগ দিন": "Attention",
      "সতর্কতা": "Warning"
    };
    return statusMap[status] || status;
  };

  // . Get status color class for history
  const getHistoryStatusColor = (date, score) => {
    // For today's log, use AI advice color if available
    if (date === today && aiAdvice) {
      const translated = getTranslatedAdvice();
      if (translated && translated.status_color) {
        const color = translated.status_color;
        if (color === "green") return "bg-green-100 text-green-700";
        if (color === "yellow") return "bg-yellow-100 text-yellow-700";
        if (color === "red") return "bg-red-100 text-red-700";
      }
    }
    // Fallback to score-based color
    if (score <= 3) return "bg-green-100 text-green-700";
    if (score <= 6) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  // . Get status text for history
  const getHistoryStatusText = (date, score) => {
    // For today's log, use AI advice status if available
    if (date === today && aiAdvice) {
      const translated = getTranslatedAdvice();
      if (translated && translated.status) {
        return getAdviceStatus(translated);
      }
    }
    // Fallback to score-based status
    if (score <= 3) return t.normal;
    if (score <= 6) return t.attention;
    return t.alert;
  };

  const translatedAdvice = getTranslatedAdvice();
  const statusColor = getStatusColor(translatedAdvice);
  const adviceStatus = getAdviceStatus(translatedAdvice);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">{t.symptomScore}</p>
            <Target size={14} className="text-gray-400" />
          </div>
          <p className={`text-3xl font-bold ${scoreColor}`}>{score}</p>
          <p className="text-xs text-gray-400 mt-0.5">/ 10</p>
          <MiniBar value={score} max={10} color={score <= 3 ? "bg-green-500" : score <= 6 ? "bg-orange-500" : "bg-red-500"} />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">{t.totalLogs}</p>
            <Award size={14} className="text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{Object.keys(allLogs).length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{t.dailyRecords}</p>
          <MiniBar value={Object.keys(allLogs).length} max={30} color="bg-blue-500" />
        </div>
      </div>

      {/* . AI Advice - BOTH languages supported */}
      {translatedAdvice && (
        <div className={`rounded-2xl p-4 border transition-all duration-300 ${
          statusColor === "green" ? "bg-green-50 border-green-200" :
          statusColor === "yellow" ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Brain size={16} className={
              statusColor === "green" ? "text-green-600" : 
              statusColor === "yellow" ? "text-yellow-600" : "text-red-600"
            } />
            <p className={`font-semibold text-sm ${
              statusColor === "green" ? "text-green-800" : 
              statusColor === "yellow" ? "text-yellow-800" : "text-red-800"
            }`}>{t.aiAdvice}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${
              statusColor === "green" ? "bg-green-200 text-green-800" :
              statusColor === "yellow" ? "bg-yellow-200 text-yellow-800" : "bg-red-200 text-red-800"
            }`}>
              {adviceStatus}
            </span>
          </div>
          
          <p className="text-sm text-gray-700 leading-relaxed">
            {translatedAdvice.summary}
          </p>
          
          <div className="mt-3 space-y-1.5">
            {translatedAdvice.advice?.map((a, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-blue-500">•</span> {a}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Symptom Log */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
          <p className="font-semibold text-gray-800 text-sm">{t.todayLog}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t.selectSeverity}</p>
        </div>
        <div className="p-4 space-y-4">
          {SYMPTOM_LIST.map(({ id, labelBn, labelEn }) => {
            const label = language === "bn" ? labelBn : labelEn;
            const val = todayLog.symptoms?.[id] ?? 0;
            const scaleLabel = language === "bn" ? SCALE[val].labelBn : SCALE[val].labelEn;
            return (
              <div key={id}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${SCALE[val].color}`}>{scaleLabel}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {SCALE.map(s => {
                    const btnLabel = language === "bn" ? s.labelBn : s.labelEn;
                    return (
                      <button
                        key={s.value}
                        onClick={() => setTodayLog(p => ({ 
                          ...p, 
                          symptoms: { ...p.symptoms, [id]: s.value } 
                        }))}
                        className={`py-1.5 rounded-lg text-xs font-medium transition border ${
                          val === s.value ? s.color + " border-transparent shadow-sm" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {btnLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={saveLog}
        disabled={saving}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
          saved ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
        } shadow-sm`}
      >
        {saving ? t.saving : saved ? t.saved : t.saveLog}
      </button>

      {/* History Logs with Delete Option */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <p className="font-semibold text-gray-800 text-sm">{t.logHistory}</p>
          <span className="text-xs text-gray-400">{Object.keys(allLogs).length} {t.totalLogs}</span>
        </div>
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {Object.entries(allLogs).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14).map(([date, log]) => {
            const score = log.symptom_score ?? 0;
            
            //  Get status text and color from AI advice for today's log
            const statusText = getHistoryStatusText(date, score);
            const statusColor = getHistoryStatusColor(date, score);
            
            const locale = language === "bn" ? "bn-BD" : "en-US";
            const isToday = date === today;
            
            return (
              <div key={date} className="px-4 py-3 hover:bg-gray-50 transition group">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">
                      {new Date(date).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
                      {isToday && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {language === "bn" ? "আজ" : "Today"}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                      {statusText}
                    </span>
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteLog(date)}
                      disabled={deleting}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {Object.keys(allLogs).length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">{t.noLogs}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}