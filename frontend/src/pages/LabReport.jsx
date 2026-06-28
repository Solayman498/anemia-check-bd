import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Droplet, Activity, Heart, Shield } from "lucide-react";

function LabReport() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    hb: "",
    rbc: "",
    pcv: "",
    mcv: "",
    mch: "",
    mchc: "",
  });

  const [errors, setErrors] = useState({});

  const fields = [
    { name: "hb",   label: t.hemoglobin,  unit: t.gdl, placeholder: t.labHbPlaceholder, icon: Droplet, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "rbc",  label: t.rbcCount,    unit: t.milUl, placeholder: t.labRbcPlaceholder, icon: Activity, color: "text-green-600", bg: "bg-green-50" },
    { name: "pcv",  label: t.pcv,         unit: t.percent, placeholder: t.labPcvPlaceholder, icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
    { name: "mcv",  label: t.mcv,         unit: t.fL, placeholder: t.labMcvPlaceholder, icon: Heart, color: "text-red-600", bg: "bg-red-50" },
    { name: "mch",  label: t.mch,         unit: t.pg, placeholder: t.labMchPlaceholder, icon: Shield, color: "text-orange-600", bg: "bg-orange-50" },
    { name: "mchc", label: t.mchc,        unit: t.gdl, placeholder: t.labMchcPlaceholder, icon: Activity, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validate = () => {
    const newErrors = {};
    fields.forEach(({ name, label }) => {
      if (!form[name]) {
        newErrors[name] = t.errorRequired;
      }
    });
    return newErrors;
  };

  const handleSubmit = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    localStorage.setItem("labReport", JSON.stringify(form));
    navigate("/symptoms");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
            <h1 className="text-xl font-bold">{t.bloodTestReport}</h1>
            <p className="text-blue-100 text-sm mt-1">{t.enterCBCInfo}</p>
            <p className="text-blue-200 text-xs mt-2">⚠️ {t.requiredFields}</p>
          </div>

          {/* Step Indicator */}
          <div className="px-6 pt-5">
            <div className="flex items-center justify-between max-w-xs mx-auto">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">✓</div>
                <p className="text-xs text-gray-500 mt-1">{t.profile}</p>
              </div>
              <div className="w-12 h-0.5 bg-green-600"></div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</div>
                <p className="text-xs text-blue-600 font-medium mt-1">{t.labReport}</p>
              </div>
              <div className="w-12 h-0.5 bg-gray-200"></div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 text-xs font-bold flex items-center justify-center">3</div>
                <p className="text-xs text-gray-400 mt-1">{t.symptoms}</p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              {fields.map(({ name, label, unit, placeholder, icon: Icon, color, bg }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                    <span className="text-gray-400 text-xs ml-1">({unit})</span>
                    <span className="text-red-500 text-xs ml-1">*</span>
                  </label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon size={14} className={color} />
                    </div>
                    <input
                      type="number"
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      step="0.1"
                      className="w-full border border-gray-200 rounded-lg pl-12 pr-3 py-2.5 text-gray-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                    />
                  </div>
                  {errors[name] && (
                    <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 rounded-lg p-3 mt-5 border border-blue-100">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <span className="text-base">💡</span>
                {t.enterCBCInfo}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 transition flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              {t.back}
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {t.next}
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default LabReport;