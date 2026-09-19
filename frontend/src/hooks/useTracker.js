// src/hooks/useTracker.js
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { useLanguage } from "./useLanguage";

const SYMPTOM_LIST = [
  { id: "fatigue", labelBn: "ক্লান্তি", labelEn: "Fatigue" },
  { id: "dizziness", labelBn: "মাথা ঘোরা", labelEn: "Dizziness" },
  { id: "swelling", labelBn: "ফোলাভাব", labelEn: "Swelling" },
  { id: "breathless", labelBn: "শ্বাসকষ্ট", labelEn: "Breathlessness" },
  { id: "heartbeat", labelBn: "বুক ধড়ফড়", labelEn: "Heart Palpitations" },
  { id: "headache", labelBn: "মাথাব্যথা", labelEn: "Headache" },
  { id: "pale_eyes", labelBn: "চোখ ফ্যাকাশে", labelEn: "Pale Eyes" },
  { id: "concentration", labelBn: "মনোযোগ সমস্যা", labelEn: "Concentration Issues" },
];

export const getTodayKey = () => new Date().toISOString().split("T")[0];

export const getStatus = (score, maxIntensity = 0, activeSymptomCount = 0) => {
  if (score > 5.5 || maxIntensity === 3 || activeSymptomCount >= 4) {
    return { text: "Warning", color: "red", emoji: "🔴", bg: "bg-red-100", textColor: "text-red-700" };
  }
  if (score > 2.5 || activeSymptomCount >= 2 || maxIntensity === 2) {
    return { text: "Attention", color: "yellow", emoji: "🟡", bg: "bg-yellow-100", textColor: "text-yellow-700" };
  }
  return { text: "Good", color: "green", emoji: "🟢", bg: "bg-green-100", textColor: "text-green-700" };
};

export const calculateScore = (symptoms) => {
  if (!symptoms || Object.keys(symptoms).length === 0) return 0;

  const highRiskSymptoms = ["breathless", "heartbeat"];
  let totalPoints = 0;
  let activeCount = 0;

  SYMPTOM_LIST.forEach(({ id }) => {
    const val = symptoms[id] || 0;
    if (val > 0) {
      activeCount++;
      let weight = val === 1 ? 1.5 : val === 2 ? 3.5 : 5.0;
      if (highRiskSymptoms.includes(id)) {
        weight *= 1.25;
      }
      totalPoints += weight;
    }
  });

  if (activeCount === 0) return 0;

  const calculated = Math.min(10, (totalPoints / 22) * 10);
  return Math.round(calculated * 10) / 10;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function useTracker() {
  const { language } = useLanguage();
  const today = getTodayKey();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [todayLog, setTodayLog] = useState({ symptoms: {}, note: "" });
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [streak, setStreak] = useState(0);
  const [calendarData, setCalendarData] = useState({});
  const [frequentSymptoms, setFrequentSymptoms] = useState([]);
  const [needsAttention, setNeedsAttention] = useState([]);
  const [statistics, setStatistics] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Auto calculate current score & status when symptoms change
  useEffect(() => {
    const newScore = calculateScore(todayLog.symptoms);
    const activeValues = Object.values(todayLog.symptoms || {}).filter(v => v > 0);
    const maxIntensity = activeValues.length > 0 ? Math.max(...activeValues) : 0;
    
    setScore(newScore);
    setStatus(getStatus(newScore, maxIntensity, activeValues.length));
  }, [todayLog.symptoms]);

  const processAllData = (logs) => {
    const symptomAvg = {};
    SYMPTOM_LIST.forEach(({ id }) => {
      const values = logs.map((log) => log.symptoms?.[id] || 0);
      const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1);
      symptomAvg[id] = Math.round(avg * 10) / 10;
    });
    setTrendData(
      SYMPTOM_LIST.map(({ id, labelBn, labelEn }) => ({
        id,
        label: language === "bn" ? labelBn : labelEn,
        avg: symptomAvg[id] || 0,
        max: 3,
      }))
    );

    const dateSet = new Set(logs.map((log) => log.date));
    let count = 0;
    let d = new Date();
    while (dateSet.has(d.toISOString().split("T")[0])) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    setStreak(count);

    const calendar = {};
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    logs.forEach((log) => {
      const logDate = new Date(log.date);
      if (logDate >= startOfMonth && logDate <= endOfMonth) {
        const s = getStatus(log.score || 0);
        calendar[log.date] = { emoji: s.emoji, color: s.color, log: log };
      }
    });
    setCalendarData(calendar);

    const countMap = {};
    SYMPTOM_LIST.forEach(({ id }) => {
      countMap[id] = logs.filter((log) => (log.symptoms?.[id] || 0) > 0).length;
    });
    const sorted = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, cnt]) => {
        const symptom = SYMPTOM_LIST.find((s) => s.id === id);
        return {
          id,
          label: language === "bn" ? symptom?.labelBn : symptom?.labelEn,
          count: cnt,
        };
      });
    setFrequentSymptoms(sorted);

    const last7 = logs.slice(-7);
    const attention = [];
    SYMPTOM_LIST.forEach(({ id, labelBn, labelEn }) => {
      const values = last7.map((log) => log.symptoms?.[id] || 0);
      if (values.length >= 5) {
        const trend = values[values.length - 1] - values[0];
        if (trend > 0.5) {
          attention.push({
            id,
            label: language === "bn" ? labelBn : labelEn,
            trend: trend,
            severity: trend > 1 ? "high" : "medium",
          });
        }
      }
    });
    setNeedsAttention(attention);

    const last7Logs = logs.slice(-7);
    if (last7Logs.length >= 1) {
      const scores = last7Logs.map((log) => log.score || 0);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const highest = scores.length > 0 ? Math.max(...scores) : 0;
      const lowest = scores.length > 0 ? Math.min(...scores) : 0;

      let trend = "stable";
      if (scores.length >= 2) {
        const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
        const secondHalf = scores.slice(Math.floor(scores.length / 2));
        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        if (avgSecond < avgFirst - 0.5) trend = "improving";
        else if (avgSecond > avgFirst + 0.5) trend = "worsening";
      }

      setWeeklySummary({
        average: Math.round(avg * 10) / 10,
        highest: Math.round(highest * 10) / 10,
        lowest: Math.round(lowest * 10) / 10,
        totalDays: 7,
        completedDays: last7Logs.length,
        trend,
      });
    }

    const allScores = logs.map((log) => log.score || 0);
    const avgScore = allScores.length > 0 
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length * 10) / 10 
      : 0;
    setStatistics({
      totalLogs: logs.length,
      streak: count,
      avgScore,
      lastLogDate: logs.length > 0 ? logs[logs.length - 1].date : null,
    });
  };

  const updateAnalysisFromLogs = (logs) => {
    if (logs.length > 0) {
      // Find current log and the last past log before today
      const pastLogs = logs.filter((l) => l.date !== today);
      const lastPastLog = pastLogs.length > 0 ? pastLogs[pastLogs.length - 1] : null;
      const todayLogData = logs.find((l) => l.date === today) || logs[logs.length - 1];

      const todayScore = todayLogData?.score || 0;
      const lastScore = lastPastLog?.score !== undefined && lastPastLog?.score !== null 
        ? lastPastLog.score 
        : null;
      
      let trend = null;
      let trendDiff = null;
      
      if (lastScore !== null) {
        trendDiff = Math.round((todayScore - lastScore) * 10) / 10;
        if (trendDiff < -0.3) trend = "improving";
        else if (trendDiff > 0.3) trend = "worsening";
        else trend = "stable";
      }
      
      const activeVals = Object.values(todayLogData?.symptoms || {}).filter(v => v > 0);
      const maxInt = activeVals.length > 0 ? Math.max(...activeVals) : 0;

      setAnalysis({
        todayScore,
        lastScore,
        lastLogDate: lastPastLog?.date || null,
        trend,
        trendDiff,
        status: getStatus(todayScore, maxInt, activeVals.length),
      });
    }
  };

  // ✅ AI Advice with Date-wise Comparison
  const fetchAIAdvice = async (uid, trackerPayload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tracker-advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: uid,
          language: language,
          current_date: trackerPayload.currentDate,
          current_score: trackerPayload.currentScore,
          symptoms: trackerPayload.symptoms,
          last_log_date: trackerPayload.lastLogDate,
          last_log_score: trackerPayload.lastLogScore,
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

      if (advice[language]) {
        setAiAdvice(advice[language]);
      } else if (advice.bn && advice.en) {
        setAiAdvice(language === "bn" ? advice.bn : advice.en);
      } else {
        setAiAdvice(advice);
      }

    } catch (error) {
      console.error("Error fetching AI advice:", error);
    }
  };

  const saveLog = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    setIsSaving(true);
    try {
      const currentScore = calculateScore(todayLog.symptoms);
      const activeValues = Object.values(todayLog.symptoms || {}).filter(v => v > 0);
      const maxIntensity = activeValues.length > 0 ? Math.max(...activeValues) : 0;
      const currentStatus = getStatus(currentScore, maxIntensity, activeValues.length);

      const logData = {
        symptoms: todayLog.symptoms,
        note: todayLog.note || "",
        date: today,
        score: currentScore,
        status: currentStatus?.text || "Good",
        updatedAt: new Date().toISOString(),
      };
      
      // ১. ডাটাবেসে সেভ
      await setDoc(doc(db, "users", uid, "daily_logs", today), logData);
      
      // ২. ফ্রেশ সব ডাটা ফেচ
      const logsSnap = await getDocs(
        query(collection(db, "users", uid, "daily_logs"), orderBy("date", "asc"))
      );
      const freshLogs = logsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      
      setAllLogs(freshLogs);
      processAllData(freshLogs);
      updateAnalysisFromLogs(freshLogs);
      
      // ৩. আজকের আগের সর্বশেষ পুরোনো লগ খোঁজা
      const pastLogs = freshLogs.filter((log) => log.date !== today);
      const lastLog = pastLogs.length > 0 ? pastLogs[pastLogs.length - 1] : null;

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      
      // ৪. তারিখ ও স্কোর সরাসরি ব্যাকএন্ডে পাঠানো
      await fetchAIAdvice(uid, {
        currentDate: today,
        currentScore: currentScore,
        symptoms: todayLog.symptoms,
        lastLogDate: lastLog ? lastLog.date : null,
        lastLogScore: lastLog ? lastLog.score : null,
      });

    } catch (error) {
      console.error("Error saving log:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLog = async (date) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "users", uid, "daily_logs", date));
      
      const logsSnap = await getDocs(
        query(collection(db, "users", uid, "daily_logs"), orderBy("date", "asc"))
      );
      const freshLogs = logsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      
      setAllLogs(freshLogs);
      processAllData(freshLogs);
      updateAnalysisFromLogs(freshLogs);
      
      if (date === today) {
        setTodayLog({ symptoms: {}, note: "" });
      }
      
      setShowHistoryModal(false);
      setShowDeleteConfirm(false);
      setSelectedLog(null);
      setSelectedDate(null);
      setDeleteTarget(null);
      
    } catch (error) {
      console.error("Error deleting log:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDateClick = (date) => {
    const log = calendarData[date]?.log;
    if (log) {
      setSelectedDate(date);
      setSelectedLog(log);
      setShowHistoryModal(true);
    }
  };

  // Initial Fetching
  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) { if(isMounted) setLoading(false); return; }

      try {
        const todaySnap = await getDoc(doc(db, "users", uid, "daily_logs", today));
        if (todaySnap.exists() && isMounted) {
          const data = todaySnap.data();
          setTodayLog({ symptoms: data.symptoms || {}, note: data.note || "" });
        }

        const logsSnap = await getDocs(
          query(collection(db, "users", uid, "daily_logs"), orderBy("date", "asc"))
        );
        const logs = logsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        
        if (isMounted) {
          setAllLogs(logs);
          if (logs.length > 0) {
            processAllData(logs);
            updateAnalysisFromLogs(logs);
          }
        }

        if (todaySnap.exists() && isMounted) {
          const adviceSnap = await getDoc(doc(db, "users", uid, "tracker_advice", "latest"));
          if (adviceSnap.exists()) {
            const advice = adviceSnap.data();
            if (advice[language]) {
              setAiAdvice(advice[language]);
            } else if (advice.bn && advice.en) {
              setAiAdvice(language === "bn" ? advice.bn : advice.en);
            } else {
              setAiAdvice(advice);
            }
          }
        }

      } catch (error) {
        console.error("Error fetching tracker data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();
    return () => { isMounted = false; };
  }, [today, language]);

  return {
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
    needsAttention,
    statistics,
    allLogs,
    isSaving,
    isSaved,
    isDeleting,
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
  };
}