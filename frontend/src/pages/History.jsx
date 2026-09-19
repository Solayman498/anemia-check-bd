import { useEffect, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Calendar, Trash2, ChevronDown, ChevronUp, Activity, Droplet, AlertCircle, CheckCircle, TrendingUp, CheckSquare, Square, Brain, Target, Clock, Utensils } from "lucide-react";

function History() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

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

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        
        const q = query(
          collection(db, "users", uid, "results"),
          orderBy("date", "desc")
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRecords(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(t.deleteRecord)) return;
    
    setDeletingId(id);
    try {
      const uid = auth.currentUser?.uid;
      await deleteDoc(doc(db, "users", uid, "results", id));
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (expanded === id) setExpanded(null);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (e) {
      console.error(e);
      alert(t.deleteError || "ডিলিট করতে সমস্যা হয়েছে");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`${selectedIds.size} ${t.recordsToDelete || "টি রেকর্ড ডিলিট করতে চান?"}`)) return;
    
    const uid = auth.currentUser?.uid;
    const deletePromises = Array.from(selectedIds).map(id => 
      deleteDoc(doc(db, "users", uid, "results", id))
    );
    
    try {
      await Promise.all(deletePromises);
      setRecords((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
      setIsSelectMode(false);
      if (expanded && selectedIds.has(expanded)) setExpanded(null);
    } catch (e) {
      console.error(e);
      alert(t.deleteError || "ডিলিট করতে সমস্যা হয়েছে");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const getRiskColor = (color) => {
    const colors = {
      red: "bg-red-50 text-red-700 border-red-200",
      orange: "bg-orange-50 text-orange-700 border-orange-200",
      yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
      green: "bg-green-50 text-green-700 border-green-200",
    };
    return colors[color] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getRiskBgColor = (level) => {
    if (level === "Severe") return "bg-red-100 text-red-800";
    if (level === "Moderate") return "bg-orange-100 text-orange-800";
    if (level === "Mild") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const locale = language === "bn" ? "bn-BD" : "en-US";
    return d.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm">{t.loading || "লোড হচ্ছে..."}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-9 h-9 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
            >
              <span className="text-lg">←</span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{t.screeningHistory}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{t.previousRecords}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isSelectMode ? (
              <button
                onClick={() => setIsSelectMode(true)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-1.5"
              >
                <CheckSquare size={14} />
                {t.selectMode}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-1.5"
                >
                  {selectedIds.size === records.length ? <Square size={14} /> : <CheckSquare size={14} />}
                  {t.selectAll}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition flex items-center gap-1.5 ${
                    selectedIds.size > 0 
                      ? "bg-red-600 text-white hover:bg-red-700" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Trash2 size={14} />
                  {t.delete} ({selectedIds.size})
                </button>
                <button
                  onClick={() => {
                    setIsSelectMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  {t.cancel}
                </button>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-1.5">
              <span className="text-xs text-gray-500">{t.total}:</span>
              <span className="text-lg font-bold text-blue-600 ml-1">{records.length}</span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {records.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-gray-600 font-medium">{t.noScreening}</p>
            <p className="text-gray-400 text-sm mt-1 mb-5">{t.firstScreening}</p>
            <button
              onClick={() => navigate("/lab")}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              {t.startScreening}
            </button>
          </div>
        )}

        {/* Records List */}
        <div className="space-y-4">
          {records.map((record) => {
            const risk = record.risk || {};
            const riskColor = getRiskColor(risk.color);
            const riskBg = getRiskBgColor(risk.level);
            const isNormal = risk.level === "Normal";
            const isSelected = selectedIds.has(record.id);
            const advice = record.advice || {};
            
            // . Get translated values
            const riskLevelDisplay = getRiskLevel(risk);
            const doctorAdvice = getDoctorAdvice(risk);
            const anemiaTypeDisplay = getAnemiaType(risk);
            
            // . Translated advice
            const translatedAdvice = getTranslated(advice);
            const whyResult = translatedAdvice?.why_result || null;
            const actionPlan = translatedAdvice?.action_plan || null;
            const symptomsAnalysis = translatedAdvice?.symptoms_analysis || [];
            const nutritionGuidance = translatedAdvice?.nutrition_guidance || null;
            
            // . Hero values
            const heroAnemiaType = language === "bn" 
              ? advice?.hero?.anemia_type_bn 
              : advice?.hero?.anemia_type_en;
            
            const heroRiskLevel = language === "bn" 
              ? advice?.hero?.risk_level_bn 
              : advice?.hero?.risk_level_en;
            
            return (
              <div 
                key={record.id} 
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                  expanded === record.id ? 'shadow-md' : ''
                } ${isSelected ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-200'}`}
              >
                {/* Header Section */}
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      {isSelectMode && (
                        <button
                          onClick={() => toggleSelect(record.id)}
                          className="text-gray-500 hover:text-blue-600 transition"
                        >
                          {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                        </button>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-500">{formatDate(record.date)}</span>
                      </div>
                    </div>
                    {!isSelectMode && (
                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={deletingId === record.id}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        {deletingId === record.id ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Hero Section */}
                  <div className="mb-3">
                    <h2 className="text-xl font-bold text-gray-800">
                      {heroAnemiaType || (isNormal ? t.riskNormal : `${riskLevelDisplay} ${t.anemia}`)}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {advice?.hero?.confidence && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          <Brain size={12} /> {advice.hero.confidence}% {t.confidence}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${riskBg}`}>
                        <Target size={12} /> {t.riskLevel}: {heroRiskLevel || riskLevelDisplay}
                      </span>
                    </div>
                  </div>

                  {/* HB and Key Info */}
                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    {record.labData?.hb && (
                      <div className="flex items-center gap-1.5">
                        <Droplet size={14} className="text-blue-500" />
                        <span className="text-sm font-medium text-gray-800">
                          {t.hemoglobin}: <span className="text-blue-600">{record.labData.hb} g/dL</span>
                        </span>
                      </div>
                    )}
                    {record.ml_result && (
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-gray-400" />
                        <span className={`text-sm font-medium ${record.ml_result.is_anemic ? 'text-red-600' : 'text-green-600'}`}>
                          ML: {record.ml_result.is_anemic ? t.anemic : t.normal} ({record.ml_result.confidence}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Why Result Preview */}
                  {whyResult && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
                      <p className="text-xs text-gray-500 font-medium">{t.whyResult}</p>
                      <p className="text-sm text-gray-700 line-clamp-2">{whyResult}</p>
                    </div>
                  )}

                  {/* Doctor Advice */}
                  <div className="bg-blue-50 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-blue-700 font-medium">{t.advice}</p>
                    <p className="text-sm text-blue-800">{actionPlan?.urgency || doctorAdvice}</p>
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => setExpanded(expanded === record.id ? null : record.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    {expanded === record.id ? (
                      <>
                        <ChevronUp size={14} />
                        {t.collapse}
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        {t.expand}
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                {expanded === record.id && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                    
                    {/* Why Result */}
                    {whyResult && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                          <Brain size={12} /> {t.whyResult}
                        </h4>
                        <p className="text-sm text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-200">
                          {whyResult}
                        </p>
                      </div>
                    )}

                    {/* Action Plan */}
                    {actionPlan?.steps && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                          <Target size={12} /> {t.actionPlan}
                        </h4>
                        <div className="space-y-1.5">
                          {actionPlan.steps.map((step, i) => (
                            <div key={i} className="flex gap-2 items-start bg-white rounded-lg px-3 py-2 border border-gray-200">
                              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 text-xs font-bold">{i + 1}</span>
                              </div>
                              <p className="text-sm text-gray-700">{step}</p>
                            </div>
                          ))}
                        </div>
                        {actionPlan.safety && (
                          <p className="text-xs text-amber-600 mt-2 px-3 py-1 bg-amber-50 rounded-lg">
                            ⚠️ {actionPlan.safety}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Symptoms Analysis */}
                    {symptomsAnalysis?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                          <Activity size={12} /> {t.symptomAnalysis}
                        </h4>
                        <div className="space-y-3">
                          {symptomsAnalysis.map((item, i) => (
                            <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
                              <h5 className="font-semibold text-gray-800 mb-1">{item.title}</h5>
                              <p className="text-sm text-gray-600">{item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nutrition Guidance */}
                    {nutritionGuidance && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                          <Utensils size={12} /> {t.nutritionGuidance}
                        </h4>
                        <div className="bg-white rounded-lg px-3 py-3 border border-gray-200 space-y-4">
                          <h5 className="font-semibold text-gray-800">{nutritionGuidance.title}</h5>
                          <div>
                            <p className="font-medium text-green-700 mb-2">✔ {t.recommendedFoods}</p>
                            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
                              {nutritionGuidance.recommended_foods?.map((food, i) => (
                                <li key={i}>{food}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-red-700 mb-2">❌ {t.foodsToAvoid}</p>
                            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
                              {nutritionGuidance.foods_to_avoid?.map((food, i) => (
                                <li key={i}>{food}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <span className="font-medium text-amber-700">{t.specialAdvice}:</span>
                            <p className="text-sm text-gray-700 mt-1">{nutritionGuidance.tip}</p>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default History;