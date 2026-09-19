// src/components/ui/StatusBadge.jsx
import { useLanguage } from "../../hooks/useLanguage";

export function StatusBadge({ status }) {
  const { language } = useLanguage();

  if (!status) return null;

  const text = language === "bn" 
    ? status.text === "Good" ? "ভালো" 
    : status.text === "Attention" ? "মনোযোগ" 
    : "সতর্কতা"
    : status.text;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.textColor}`}>
      {status.emoji} {text}
    </span>
  );
}