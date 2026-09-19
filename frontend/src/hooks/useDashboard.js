// src/hooks/useDashboard.js
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { useLanguage } from "./useLanguage";

// ─── Health Tips (Local) ───
const HEALTH_TIPS = [
  { bn: "প্রতিদিন পর্যাপ্ত পানি পান করুন।", en: "Drink enough water every day." },
  { bn: "আয়রন সমৃদ্ধ খাবার খান।", en: "Eat iron-rich foods." },
  { bn: "নিয়মিত হালকা ব্যায়াম করুন।", en: "Exercise regularly." },
  { bn: "পর্যাপ্ত ঘুম নিশ্চিত করুন।", en: "Ensure adequate sleep." },
  { bn: "মানসিক চাপ কমানোর চেষ্টা করুন।", en: "Try to reduce stress." },
  { bn: "ভিটামিন সি সমৃদ্ধ ফল খান।", en: "Eat Vitamin C rich fruits." },
  { bn: "নিয়মিত স্বাস্থ্য পরীক্ষা করান।", en: "Get regular health checkups." },
  { bn: "ধূমপান ও মদ্যপান এড়িয়ে চলুন।", en: "Avoid smoking and alcohol." },
];

export function useDashboard() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [healthTip, setHealthTip] = useState(null);
  const [isHighRisk, setIsHighRisk] = useState(false);
  const [hbTrend, setHbTrend] = useState([]);
  const [symptomTrend, setSymptomTrend] = useState([]);
  const [greeting, setGreeting] = useState("");

  // ─── Get Greeting ───
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === "bn") {
      if (hour < 12) return "শুভ সকাল";
      if (hour < 18) return "শুভ বিকেল";
      return "শুভ সন্ধ্যা";
    }
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // ─── Get Random Health Tip ───
  const getRandomTip = () => {
    const tip = HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)];
    return language === "bn" ? tip.bn : tip.en;
  };

  // ─── Fetch Data ───
  useEffect(() => {
    const fetchDashboardData = async () => {
      const user = auth.currentUser;
      if (!user) { 
        setLoading(false); 
        return; 
      }

      try {
        const uid = user.uid;

        // ─── Parallel Fetch for Speed ───
        const [
          profileSnap,
          lastResultSnap,
          logSnap,
          logsSnap,
          hbResults,
          symptomLogs,
          allLogs,
          allResults,
          adviceSnap,
        ] = await Promise.all([
          getDoc(doc(db, "users", uid)),
          getDocs(query(collection(db, "users", uid, "results"), orderBy("date", "desc"), limit(1))),
          getDoc(doc(db, "users", uid, "daily_logs", new Date().toISOString().split("T")[0])),
          getDocs(query(collection(db, "users", uid, "daily_logs"), orderBy("date", "desc"))),
          getDocs(query(collection(db, "users", uid, "results"), orderBy("date", "desc"), limit(10))),
          getDocs(query(collection(db, "users", uid, "daily_logs"), orderBy("date", "desc"), limit(10))),
          getDocs(query(collection(db, "users", uid, "daily_logs"))),
          getDocs(query(collection(db, "users", uid, "results"), orderBy("date", "asc"))),
          getDoc(doc(db, "users", uid, "tracker_advice", "latest")),
        ]);

        // ─── Profile ───
        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
        }

        // ─── Last Screening ───
        let riskLevel = "Normal";
        let hbValue = null;
        if (!lastResultSnap.empty) {
          const lastResult = lastResultSnap.docs[0].data();
          riskLevel = lastResult.risk?.level || "Normal";
          hbValue = lastResult.labData?.hb || null;
        }

        // ─── Today's Symptom Score ───
        let symptomScore = null;
        if (logSnap.exists()) {
          symptomScore = logSnap.data().score || 0;
        }
  

        // ─── Streak ───
        const logs = logsSnap.docs.map((doc) => doc.data());
        let streak = 0;
        const dateSet = new Set(logs.map((log) => log.date));
        let d = new Date();
        while (dateSet.has(d.toISOString().split("T")[0])) {
          streak++;
          d.setDate(d.getDate() - 1);
        }

        // ─── HB Trend ───
        const hbData = hbResults.docs
          .map((doc) => {
            const data = doc.data();
            const hb = data?.labData?.hb;
            return {
              date: data.date,
              hb: hb !== undefined && hb !== null ? parseFloat(hb) : null,
            };
          })
          .filter((item) => item.hb !== null)
          .reverse();
        setHbTrend(hbData);

        // ─── Symptom Trend ───
        const symptomData = symptomLogs.docs
          .map((doc) => {
            const data = doc.data();
            return {
              date: data.date,
              score: data.score !== undefined && data.score !== null ? parseFloat(data.score) : 0,
            };
          })
          .reverse();
        setSymptomTrend(symptomData);

        // ─── Achievements ───
        const totalLogs = allLogs.size;
        const hbValues = allResults.docs
          .map((doc) => doc.data().labData?.hb)
          .filter((v) => v !== null && v !== undefined);
        let hbImproved = 0;
        if (hbValues.length >= 2) {
          hbImproved = Math.round((hbValues[hbValues.length - 1] - hbValues[0]) * 10) / 10;
        }
        setAchievements({
          totalLogs,
          streak,
          hbImproved,
        });

        // ─── Health Data ───
        setHealthData({
          hb: hbValue,
          riskLevel,
          symptomScore,
          streak,
          riskColor: riskLevel === "Severe" ? "red" : riskLevel === "Moderate" ? "orange" : riskLevel === "Mild" ? "yellow" : "green",
        });

        // ─── High Risk ───
        setIsHighRisk(riskLevel === "Severe" || riskLevel === "Moderate");

        // ─── Health Tip ───
        setHealthTip(getRandomTip());

        // ─── Greeting ───
        setGreeting(getGreeting());

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [language]);

  return {
    loading,
    profile,
    healthData,
    achievements,
    healthTip,
    isHighRisk,
    hbTrend,
    symptomTrend,
    greeting,
  };
}