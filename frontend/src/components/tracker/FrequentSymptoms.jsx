// src/components/tracker/FrequentSymptoms.jsx
import { useLanguage } from "../../hooks/useLanguage";
import { ProgressBar } from "../ui/ProgressBar";

export default function FrequentSymptoms({ data }) {
  const { t } = useLanguage();

  if (!data || data.length === 0) return null;

  const maxCount = data[0]?.count || 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 text-sm mb-4">
        {t.mostFrequentSymptoms || "Most Frequent Symptoms"}
      </h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{item.label}</span>
              <span className="text-gray-500">{item.count} {t.days || "days"}</span>
            </div>
            <ProgressBar value={(item.count / maxCount) * 100} color="blue" />
          </div>
        ))}
      </div>
    </div>
  );
}