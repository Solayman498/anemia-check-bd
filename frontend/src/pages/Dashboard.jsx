import { useEffect, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { 
  User, MapPin, Scale, Droplet, Calendar, 
  Activity, Heart, Clock
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [lastScreening, setLastScreening] = useState(null);
  const [lastHB, setLastHB] = useState(null);
  const [symptomScore, setSymptomScore] = useState(null);
  const [nextScreeningDays, setNextScreeningDays] = useState(null);
  const [personalizedTip, setPersonalizedTip] = useState("");

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  };

  const calculateRemainingDays = (lastDate, recommendedDays) => {
    if (!lastDate) return null;
    const last = new Date(lastDate);
    const next = new Date(last);
    next.setDate(last.getDate() + recommendedDays);
    const today = new Date();
    const diffTime = next - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // . Get district display name from translation
  const getDistrictName = (districtKey) => {
    if (!districtKey) return "--";
    if (/[ঀ-৿]/.test(districtKey)) return districtKey;
    return t.districts?.[districtKey] || districtKey;
  };

  // . Get anemia type from new risk structure
  const getAnemiaType = (riskObj) => {
    if (!riskObj) return "";
    if (riskObj?.level === "Normal") return "";
    return riskObj?.anemia_type?.[language] || riskObj?.anemia_type?.bn || "";
  };

  // Get greeting based on language
  const getGreetingText = (hour) => {
    if (hour < 12) return t.goodMorning;
    if (hour < 18) return t.goodAfternoon;
    return t.goodEvening;
  };

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(getGreetingText(hour));

    const now = new Date();
    const locale = language === "bn" ? 'bn-BD' : 'en-US';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentTime(now.toLocaleDateString(locale, options));

    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const uid = user.uid;
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) setProfile(snap.data());

        // Get last screening
        const resultsRef = collection(db, "users", uid, "results");
        const q = query(resultsRef, orderBy("date", "desc"), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const lastResult = querySnapshot.docs[0].data();
          const date = new Date(lastResult.date);
          setLastScreening(date.toLocaleDateString(locale, {
            day: 'numeric', month: 'long', year: 'numeric'
          }));
          
          if (lastResult.labData?.hb) setLastHB(lastResult.labData.hb);
          
          const riskLevel = lastResult.risk?.level;
          let recommendedDays = 180;
          if (riskLevel === "Severe") recommendedDays = 7;
          else if (riskLevel === "Moderate") recommendedDays = 30;
          else if (riskLevel === "Mild") recommendedDays = 90;
          
          const remaining = calculateRemainingDays(lastResult.date, recommendedDays);
          setNextScreeningDays(remaining);
          
          // . Get anemia type from new structure
          const anemiaType = getAnemiaType(lastResult.risk);
          
          // Set personalized tip based on anemia type and language
          if (language === "bn") {
            if (anemiaType.includes("মাইক্রোসাইটিক") || anemiaType.includes("Iron")) {
              setPersonalizedTip("আয়রন ঘাটতি পূরণে কলিজা, পালং শাক, কচু শাক, ডিম, এবং ছোট মাছ খান। লেবু বা আমলকি খেলে আয়রন শোষণ বাড়ে।");
            } else if (anemiaType.includes("ম্যাক্রোসাইটিক") || anemiaType.includes("B12")) {
              setPersonalizedTip("ভিটামিন B12 এর জন্য ডিম, দুধ, মাছ এবং মাংস খান। নিরামিষাশীরা B12 সাপ্লিমেন্ট নিতে পারেন।");
            } else if (anemiaType.includes("ফলিক") || anemiaType.includes("Folate")) {
              setPersonalizedTip("ফলিক অ্যাসিডের জন্য শাকসবজি, ডাল, কমলা, এবং ডিমের কুসুম খান।");
            } else if (anemiaType.includes("থ্যালাসেমিয়া") || anemiaType.includes("Thalassemia")) {
              setPersonalizedTip("থ্যালাসেমিয়ায় নিয়মিত রক্ত পরীক্ষা করান। আয়রন যুক্ত খাবার সতর্কতার সাথে খান। ডাক্তারের পরামর্শ নিন।");
            } else {
              setPersonalizedTip("নিয়মিত স্বাস্থ্যকর খাবার গ্রহণ করুন। আয়রন সমৃদ্ধ খাবার যেমন পালং শাক, কলিজা, ডিম খান। ভিটামিন সি (লেবু, আমলকি) আয়রন শোষণ বাড়ায়।");
            }
          } else {
            if (anemiaType.includes("Microcytic") || anemiaType.includes("Iron")) {
              setPersonalizedTip("Eat iron-rich foods like liver, spinach, taro leaves, eggs, and small fish. Lemon or amla helps iron absorption.");
            } else if (anemiaType.includes("Macrocytic") || anemiaType.includes("B12")) {
              setPersonalizedTip("Eat eggs, milk, fish and meat for Vitamin B12. Vegetarians can take B12 supplements.");
            } else if (anemiaType.includes("Folate")) {
              setPersonalizedTip("Eat vegetables, lentils, oranges, and egg yolk for Folic Acid.");
            } else if (anemiaType.includes("Thalassemia")) {
              setPersonalizedTip("Get regular blood tests for Thalassemia. Eat iron-rich foods cautiously. Consult your doctor.");
            } else {
              setPersonalizedTip("Eat regular healthy meals. Include iron-rich foods like spinach, liver, and eggs. Vitamin C (lemon, amla) helps iron absorption.");
            }
          }
        }

        // Get today's symptom score
        const todayKey = getTodayKey();
        const logSnap = await getDoc(doc(db, "users", uid, "daily_logs", todayKey));
        if (logSnap.exists()) {
          const logData = logSnap.data();
          if (logData.symptom_score !== undefined) {
            setSymptomScore(logData.symptom_score);
          }
        }

      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    fetchData();
  }, [navigate, language]);

  const getNextScreeningText = () => {
    if (nextScreeningDays === null) return "--";
    if (nextScreeningDays <= 0) return t.todayScreening;
    if (nextScreeningDays === 1) return t.tomorrow;
    return `${nextScreeningDays} ${t.daysLeft}`;
  };

  const getUserType = () => {
    if (profile?.userType === "pregnant") return t.pregnantWoman;
    if (profile?.userType === "adolescent_girl") return t.adolescentGirl;
    if (profile?.userType === "child") return t.child;
    return t.adult;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-blue-100 text-sm">{greeting},</p>
            <h1 className="text-2xl font-bold mt-1">{profile?.name || t.user}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-blue-100 text-xs">
              <span className="flex items-center gap-1"><User size={12} /> {profile?.age || "--"} {t.years} ({getUserType()})</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} /> 
                {getDistrictName(profile?.district)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {currentTime}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">{t.lastScreening}</p>
            <p className="text-white font-semibold text-sm">{lastScreening || "--"}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2">
            <Scale size={22} className="text-green-600" />
          </div>
          <p className="text-xs text-gray-500">{t.weight}</p>
          <p className="text-xl font-bold text-gray-800">{profile?.weight || "--"} <span className="text-sm font-normal">{t.kg}</span></p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-2">
            <Droplet size={22} className="text-red-600" />
          </div>
          <p className="text-xs text-gray-500">{t.lastHB}</p>
          <p className="text-xl font-bold text-gray-800">{lastHB || "--"} <span className="text-sm font-normal">g/dL</span></p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-2">
            <Activity size={22} className="text-purple-600" />
          </div>
          <p className="text-xs text-gray-500">{t.symptomScore}</p>
          <p className="text-xl font-bold text-gray-800">{symptomScore !== null ? symptomScore : "--"} <span className="text-sm font-normal">/10</span></p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
            <Calendar size={22} className="text-amber-600" />
          </div>
          <p className="text-xs text-gray-500">{t.nextScreening}</p>
          <p className="text-xl font-bold text-gray-800">{getNextScreeningText()}</p>
        </div>
      </div>

      {/* Health Tips */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <Heart size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">{t.healthTips}</h3>
            <p className="text-blue-100 text-sm leading-relaxed">{personalizedTip || (language === "bn" ? "নিয়মিত স্বাস্থ্যকর খাবার গ্রহণ করুন।" : "Eat regular healthy meals.")}</p>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <User size={18} className="text-blue-600" />
            {t.profileInfo}
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="flex justify-between items-center px-5 py-3">
            <span className="text-gray-600 text-sm">{t.gender}</span>
            <span className="text-gray-800 font-medium text-sm">
              {profile?.gender === "female" ? t.female : profile?.gender === "male" ? t.male : "--"}
            </span>
          </div>
          <div className="flex justify-between items-center px-5 py-3">
            <span className="text-gray-600 text-sm">{t.category}</span>
            <span className="text-gray-800 font-medium text-sm">{getUserType()}</span>
          </div>
          <div className="flex justify-between items-center px-5 py-3">
            <span className="text-gray-600 text-sm">{t.district}</span>
            <span className="text-gray-800 font-medium text-sm">
              {getDistrictName(profile?.district)}
            </span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
        <div className="flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <p className="text-amber-800 text-xs">{t.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;