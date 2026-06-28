import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Trash2 } from "lucide-react";

function Symptoms() {
  const location = useLocation();
  const isReuse = new URLSearchParams(location.search).get("mode") === "reuse";
  const navigate = useNavigate();
  const { t } = useLanguage();

  const symptomList = [
    { id: "fatigue", label: t.symptomFatigueLabel },
    { id: "dizziness", label: t.symptomDizzinessLabel },
    { id: "pale_skin", label: t.symptomPaleSkinLabel },
    { id: "breathless", label: t.symptomBreathlessnessLabel },
    { id: "heartbeat", label: t.symptomPalpitationsLabel },
    { id: "headache", label: t.symptomHeadacheLabel },
    { id: "pale_nails", label: t.symptomPaleNailsLabel },
    { id: "pale_eyes", label: t.symptomPaleEyesLabel },
    { id: "cold_hands", label: t.symptomColdHandsLabel },
    { id: "concentration", label: t.symptomConcentrationLabel },
  ];

  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    localStorage.setItem("symptoms", JSON.stringify(selected));
    
    if (isReuse) {
      localStorage.setItem("useLastReport", "true");
    } else {
      localStorage.removeItem("useLastReport");
    }
    
    navigate("/result");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
            <h1 className="text-xl font-bold">{t.symptomSelection}</h1>
            <p className="text-blue-100 text-sm mt-1">{t.selectSymptoms}</p>
          </div>

          {/* Step Indicator - 3 Steps */}
          <div className="px-6 pt-5">
            <div className="flex items-center justify-between max-w-xs mx-auto">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">✓</div>
                <p className="text-xs text-gray-500 mt-1">{t.labReport}</p>
              </div>
              <div className="w-12 h-0.5 bg-green-600"></div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</div>
                <p className="text-xs text-blue-600 font-medium mt-1">{t.symptoms}</p>
              </div>
              <div className="w-12 h-0.5 bg-gray-200"></div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 text-xs font-bold flex items-center justify-center">3</div>
                <p className="text-xs text-gray-400 mt-1">{t.result}</p>
              </div>
            </div>
          </div>

          {/* Reuse mode notice */}
          {isReuse && (
            <div className="mx-6 mt-5 bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <span className="text-base">📋</span>
                {t.reuseMode}
              </p>
            </div>
          )}

          {/* Selected Count */}
          <div className="mx-6 mt-5 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{t.selectedSymptoms}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${selected.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                  {selected.length}
                </span>
                <span className="text-sm text-gray-400">/ {symptomList.length}</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${(selected.length / symptomList.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Symptom Checklist */}
          <div className="px-6 py-4">
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              {symptomList.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200
                    ${selected.includes(id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                >
                  <span className={`text-sm font-medium ${
                    selected.includes(id) ? "text-blue-700" : "text-gray-700"
                  }`}>
                    {label}
                  </span>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                    ${selected.includes(id)
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300"
                    }`}>
                    {selected.includes(id) && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* No Symptom Option */}
          <div className="px-6 pb-2">
            <button
              onClick={() => setSelected([])}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-blue-600 transition-colors border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              {t.clearAll}
            </button>
          </div>

          {/* Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => navigate("/lab")}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 transition flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              {t.back}
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {t.viewResult}
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default Symptoms;