// src/components/tracker/SymptomSelector.jsx
import { useLanguage } from "../../hooks/useLanguage";

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

const SCALE = [
  { value: 0, labelBn: "নেই", labelEn: "None", color: "bg-green-100 text-green-700" },
  { value: 1, labelBn: "হালকা", labelEn: "Mild", color: "bg-yellow-100 text-yellow-700" },
  { value: 2, labelBn: "মাঝারি", labelEn: "Moderate", color: "bg-orange-100 text-orange-700" },
  { value: 3, labelBn: "তীব্র", labelEn: "Severe", color: "bg-red-100 text-red-700" },
];

export default function SymptomSelector({ symptoms, onChange }) {
  const { t, language } = useLanguage();

  const handleChange = (id, value) => {
    onChange((prev) => ({
      ...prev,
      symptoms: { ...prev.symptoms, [id]: value },
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
        <p className="font-semibold text-gray-800 text-sm">{t.symptoms || "Symptoms"}</p>
        <p className="text-xs text-gray-500 mt-0.5">{t.selectSeverity || "Select severity for each symptom"}</p>
      </div>
      <div className="p-4 space-y-4">
        {SYMPTOM_LIST.map(({ id, labelBn, labelEn }) => {
          const label = language === "bn" ? labelBn : labelEn;
          const val = symptoms?.[id] ?? 0;
          return (
            <div key={id}>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${SCALE[val].color}`}>
                  {language === "bn" ? SCALE[val].labelBn : SCALE[val].labelEn}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SCALE.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleChange(id, s.value)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition border ${
                      val === s.value
                        ? s.color + " border-transparent shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {language === "bn" ? s.labelBn : s.labelEn}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}