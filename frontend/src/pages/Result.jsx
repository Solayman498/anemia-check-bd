import { useEffect, useState, useRef } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { analyzeAnemia } from "../services/api";
import {
  doc, getDoc, addDoc, collection,
  getDocs, orderBy, query, limit
} from "firebase/firestore";
import { 
  Activity, Brain, Heart, Apple, AlertCircle, ArrowLeft, 
  Droplet, Shield, TrendingUp, Stethoscope, 
  CheckCircle, AlertTriangle, Sparkles,
  ChevronRight, Zap, Target, Clock,
  Utensils
} from "lucide-react";

// . Symptom labels - BOTH languages
const symptomLabels = {
  bn: {
    fatigue: "অতিরিক্ত ক্লান্তি",
    dizziness: "মাথা ঘোরা",
    pale_skin: "ত্বক ফ্যাকাশে",
    breathless: "শ্বাসকষ্ট",
    heartbeat: "হৃদস্পন্দন বেড়ে যাওয়া",
    headache: "মাথাব্যথা",
    pale_nails: "নখ ফ্যাকাশে",
    pale_eyes: "চোখের পাতা ফ্যাকাশে",
    cold_hands: "হাত-পা ঠান্ডা",
    concentration: "মনোযোগ সমস্যা",
  },
  en: {
    fatigue: "Excessive Fatigue",
    dizziness: "Dizziness",
    pale_skin: "Pale Skin",
    breathless: "Shortness of Breath",
    heartbeat: "Heart Palpitations",
    headache: "Headache",
    pale_nails: "Pale Nails",
    pale_eyes: "Pale Eyelids",
    cold_hands: "Cold Hands",
    concentration: "Concentration Issues",
  }
};

const RISK = {
  red: { grad: "from-red-600 to-rose-600", light: "bg-red-50", border: "border-red-200", text: "text-red-700", pill: "bg-red-100 text-red-800" },
  orange: { grad: "from-orange-500 to-amber-600", light: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", pill: "bg-orange-100 text-orange-800" },
  yellow: { grad: "from-yellow-500 to-amber-500", light: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", pill: "bg-yellow-100 text-yellow-800" },
  green: { grad: "from-green-500 to-emerald-600", light: "bg-green-50", border: "border-green-200", text: "text-green-700", pill: "bg-green-100 text-green-800" },
};

export default function Result() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);
  const saved = useRef(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;

    (async () => {
      try {
        const uid = auth.currentUser?.uid;
        const snap = await getDoc(doc(db, "users", uid));
        const profile = snap.data();
        const symptoms = JSON.parse(localStorage.getItem("symptoms") || "[]");
        let labData = null;

        if (localStorage.getItem("useLastReport") === "true") {
          const q = query(collection(db, "users", uid, "results"), orderBy("date", "desc"), limit(1));
          const last = await getDocs(q);
          if (!last.empty) labData = last.docs[0].data().labData;
        } else {
          labData = JSON.parse(localStorage.getItem("labReport") || "null");
        }

        const res = await analyzeAnemia(profile, labData, symptoms);
        
        await addDoc(collection(db, "users", uid, "results"), {
          date: new Date().toISOString(),
          ml_result: res.ml_result,
          risk: res.risk,  // ← New structure with bn/en
          advice: res.advice,
          labData,
          symptoms,
        });

        setData({ ...res, profile, labData, symptoms });
      } catch (e) {
        console.error(e);
        setError(t.errorAnalysisFailed || "বিশ্লেষণ করতে সমস্যা হয়েছে।");
      }
      setLoading(false);
    })();
  }, []);

  // . Helper: Get translated value from object (bn/en)
  const getTranslated = (obj) => {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object' && obj !== null) {
      if (obj.bn !== undefined || obj.en !== undefined) {
        return obj[language] || obj.bn || obj.en || null;
      }
      if (Array.isArray(obj)) {
        return obj.map(item => getTranslated(item));
      }
      const result = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = getTranslated(obj[key]);
        }
      }
      return result;
    }
    return obj;
  };

  // . Helper: Get risk level based on language
  const getRiskLevel = (riskObj) => {
    if (!riskObj) return "Normal";
    return riskObj?.risk_level?.[language] || riskObj?.risk_level?.bn || "স্বাভাবিক";
  };

  // . Helper: Get doctor advice based on language
  const getDoctorAdvice = (riskObj) => {
    if (!riskObj) return "";
    return riskObj?.doctor?.[language] || riskObj?.doctor?.bn || "";
  };

  // . Helper: Get anemia type based on language
  const getAnemiaType = (riskObj) => {
    if (!riskObj) return "";
    if (riskObj?.level === "Normal") return "";
    return riskObj?.anemia_type?.[language] || riskObj?.anemia_type?.bn || "";
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-blue-200"></div>
        <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="text-blue-600" size={32} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-800 font-semibold text-lg">{t.aiAnalyzing}</p>
        <p className="text-gray-500 text-sm mt-1">{t.processingData}</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <p className="font-bold text-gray-800 text-lg mb-2">{t.somethingWentWrong}</p>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button 
          onClick={() => navigate("/dashboard")} 
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          {t.backToDashboard}
        </button>
      </div>
    </div>
  );

  const {
    ml_result = {},
    risk = {},
    advice = {},
    profile = {},
    labData = {},
    symptoms = []
  } = data || {};

  const rc = RISK[risk.color] || RISK.green;
  const isAnemic = risk.level !== "Normal";
  const hbVal = labData?.hb ? parseFloat(labData.hb) : null;
  
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t.noDataFound || "ডেটা পাওয়া যায়নি"}</p>
      </div>
    );
  }

  // . Get translated data
  const translatedAdvice = getTranslated(advice);
  const whyResult = translatedAdvice?.why_result || null;
  const actionPlan = translatedAdvice?.action_plan || null;
  const symptomsAnalysis = translatedAdvice?.symptoms_analysis || [];
  const nutritionGuidance = translatedAdvice?.nutrition_guidance || null;

  // . Hero values based on language
  const heroAnemiaType = language === "bn" 
    ? advice?.hero?.anemia_type_bn 
    : advice?.hero?.anemia_type_en;
  
  const heroRiskLevel = language === "bn" 
    ? advice?.hero?.risk_level_bn 
    : advice?.hero?.risk_level_en;

  // . Get symptom label based on language
  const getSymptomLabel = (symptomId) => {
    return symptomLabels[language]?.[symptomId] || symptomLabels.bn[symptomId] || symptomId;
  };

  // Helper function to render nutrition guidance
  const renderNutritionGuidance = (nutrition) => {
    if (!nutrition || typeof nutrition !== "object") {
      return (
        <p className="text-sm text-gray-500">
          {t.noNutritionData || "পুষ্টি সংক্রান্ত তথ্য পাওয়া যায়নি"}
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {nutrition.title && (
          <h3 className="font-semibold text-gray-800">{nutrition.title}</h3>
        )}

        {nutrition.recommended_foods?.length > 0 && (
          <div>
            <p className="font-medium text-green-700 mb-2">
              {t.recommendedFoods}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {nutrition.recommended_foods.map((food, idx) => (
                <li key={idx} className="text-sm text-gray-700">{food}</li>
              ))}
            </ul>
          </div>
        )}

        {nutrition.foods_to_avoid?.length > 0 && (
          <div>
            <p className="font-medium text-red-700 mb-2">
              {t.foodsToAvoid}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {nutrition.foods_to_avoid.map((food, idx) => (
                <li key={idx} className="text-sm text-gray-700">{food}</li>
              ))}
            </ul>
          </div>
        )}

        {nutrition.tip && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>{t.specialAdvice}:</strong> {nutrition.tip}
            </p>
          </div>
        )}
      </div>
    );
  };

  // . Get risk level display
  const riskLevelDisplay = getRiskLevel(risk);
  const doctorAdvice = getDoctorAdvice(risk);
  const anemiaTypeDisplay = getAnemiaType(risk);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className={`transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition group">
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm">{t.dashboard}</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">{profile?.name?.charAt(0) || "U"}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{profile?.age} {t.years}</p>
                <p className="text-xs text-gray-500">{profile?.gender === "female" ? t.female : t.male}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🟥 1. HERO CARD */}
        <div className={`transition-all duration-500 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className={`bg-gradient-to-r ${rc.grad} rounded-xl p-6 mb-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse-glow`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-blue-100 text-xs uppercase tracking-wide">{t.screeningResult}</p>
              <Sparkles size={16} className="text-white/70" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {heroAnemiaType || (isAnemic ? `${riskLevelDisplay} ${t.anemia}` : t.normal)}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {ml_result && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Zap size={14} className="text-yellow-300" />
                  <span className="text-sm font-medium">{advice?.hero?.confidence ?? ml_result?.confidence ?? 0}% {t.confidence}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Target size={14} className="text-white/80" />
                <span className="text-sm font-medium">{t.riskLevel}: {heroRiskLevel || riskLevelDisplay}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
              <span className="text-sm">🏥</span>
              <span className="text-xs font-medium">{doctorAdvice}</span>
            </div>
          </div>
        </div>

        {/* 🟦 2. WHY THIS RESULT CARD */}
        <div className={`transition-all duration-500 delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 mb-5">
            <div className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <Brain size={18} className="text-blue-600" />
              <h2 className="font-semibold text-gray-800 text-sm tracking-wide">{t.whyResult}</h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {whyResult || `${t.yourHb} ${hbVal} g/dL ${t.andMLModel} ${ml_result?.confidence || 0}% ${t.confidence} ${ml_result?.is_anemic ? t.detectedAnemia : t.showedNormal}`}
              </p>
            </div>
          </div>
        </div>

        {/* 🟫 3. ACTION PLAN CARD */}
        <div className={`transition-all duration-500 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 mb-5">
            <div className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
              <Target size={18} className="text-amber-600" />
              <h2 className="font-semibold text-gray-800 text-sm tracking-wide">{t.actionPlan}</h2>
            </div>
            <div className="px-5 py-4">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4 ${rc.light} ${rc.text}`}>
                <Clock size={14} />
                {actionPlan?.urgency || doctorAdvice}
              </div>
              <div className="space-y-3">
                {(actionPlan?.steps || (risk.level === "Severe" ? 
                  [t.stepSevere1, t.stepSevere2, t.stepSevere3, t.stepSevere4] :
                  risk.level === "Moderate" ?
                  [t.stepModerate1, t.stepModerate2, t.stepModerate3, t.stepModerate4] :
                  risk.level === "Mild" ?
                  [t.stepMild1, t.stepMild2, t.stepMild3, t.stepMild4] :
                  [t.stepNormal1, t.stepNormal2, t.stepNormal3])).map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700 text-center">{actionPlan?.safety || t.safetyMessage}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🟪 4. SYMPTOM ANALYSIS CARD */}
        {symptoms?.length > 0 && symptomsAnalysis?.length > 0 && (
          <div className={`transition-all duration-500 delay-250 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 mb-5">
              <div className="flex items-center gap-2 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                <Heart size={18} className="text-rose-500" />
                <h2 className="font-semibold text-gray-800 text-sm tracking-wide">{t.symptomAnalysis}</h2>
              </div>
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {symptoms.map((s) => (
                    <span key={s} className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200">
                      {getSymptomLabel(s)}
                    </span>
                  ))}
                </div>
                <div className="space-y-3">
                  {symptomsAnalysis.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-800 mb-1">{item?.title}</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{item?.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🟩 5. NUTRITION GUIDANCE CARD */}
        <div className={`transition-all duration-500 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 mb-5">
            <div className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <Utensils size={18} className="text-green-600" />
              <h2 className="font-semibold text-gray-800 text-sm tracking-wide">{t.nutritionGuidance}</h2>
            </div>
            <div className="px-5 py-4">
              <div className="text-sm text-gray-700 leading-relaxed">
                {nutritionGuidance ? (
                  renderNutritionGuidance(nutritionGuidance)
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-800">{t.nutritionAdvice}</p>
                    <p className="text-sm font-medium text-gray-700 mt-2">{t.fruits}</p>
                    <p className="text-sm text-gray-600 ml-4">{t.fruitsList}</p>
                    <p className="text-sm font-medium text-gray-700 mt-2">{t.vegetables}</p>
                    <p className="text-sm text-gray-600 ml-4">{t.vegetablesList}</p>
                    <p className="text-sm font-medium text-gray-700 mt-2">{t.ironRichFoods}</p>
                    <p className="text-sm text-gray-600 ml-4">{t.ironRichList}</p>
                    <p className="text-sm font-medium text-gray-700 mt-2">{t.protein}</p>
                    <p className="text-sm text-gray-600 ml-4">{t.proteinList}</p>
                    <p className="text-sm font-medium text-gray-700 mt-2">{t.avoid}</p>
                    <p className="text-sm text-gray-600 ml-4">{t.avoidList}</p>
                  </div>
                )}
              </div>
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700">{t.generalAdviceOnly}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className={`transition-all duration-500 delay-350 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-gray-100 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">{t.resultDisclaimer}</p>
          </div>
        </div>

        {/* New Screening Button */}
        <div className={`transition-all duration-500 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={() => {
              localStorage.removeItem("labReport");
              localStorage.removeItem("symptoms");
              localStorage.removeItem("useLastReport");
              navigate("/lab");
            }}
            className="w-full mt-5 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <TrendingUp size={16} />
            {t.startNewScreening}
            <ChevronRight size={14} />
          </button>
        </div>

      </div>

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out;
        }
      `}</style>
    </div>
  );
}