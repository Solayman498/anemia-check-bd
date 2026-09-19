// src/components/dashboard/WelcomeCard.jsx
import { useLanguage } from "../../hooks/useLanguage";

export default function WelcomeCard({ profile }) {
  const { t, language } = useLanguage();
  const hour = new Date().getHours();

  let greeting = "";
  if (language === "bn") {
    if (hour < 12) greeting = "শুভ সকাল";
    else if (hour < 18) greeting = "শুভ বিকেল";
    else greeting = "শুভ সন্ধ্যা";
  } else {
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 18) greeting = "Good Afternoon";
    else greeting = "Good Evening";
  }

  const today = new Date().toLocaleDateString(
    language === "bn" ? "bn-BD" : "en-US",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" }
  );
  const time = new Date().toLocaleTimeString(
    language === "bn" ? "bn-BD" : "en-US",
    { hour: "2-digit", minute: "2-digit" }
  );

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-blue-100 text-sm">
            {greeting}, {profile?.name || t.user || "User"} 
          </p>
          <h1 className="text-2xl font-bold mt-1">
            {t.welcomeBack || "Welcome back to AnemiaCheck-BD"}
          </h1>
          <p className="text-blue-200 text-xs mt-2">
            {t.lastUpdated || "Last updated"}: {today}, {time}
          </p>
        </div>
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg">
          {profile?.name?.charAt(0) || "U"}
        </div>
      </div>
    </div>
  );
}