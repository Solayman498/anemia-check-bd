// src/pages/Dashboard.jsx
import { useDashboard } from "../hooks/useDashboard";
import { useLanguage } from "../hooks/useLanguage";
import {
  WelcomeCard,
  HealthOverview,
  QuickActions,
  ProgressPreview,
  Achievements,
  HealthTip,
  EmergencyNotice,
} from "../components/dashboard";

export default function Dashboard() {
  const { t } = useLanguage();
  const {
    loading,
    profile,
    healthData,
    achievements,
    healthTip,
    isHighRisk,
    hbTrend,
    symptomTrend,
  } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Section 1: Welcome Card */}
      <WelcomeCard profile={profile} />

      {/* Section 2: Health Overview */}
      <HealthOverview data={healthData} />

      {/* Section 3: Quick Actions */}
      <QuickActions />

      {/* Section 4: Progress Preview */}
      <ProgressPreview hbTrend={hbTrend} symptomTrend={symptomTrend} />

      {/* Section 5: Achievements */}
      <Achievements data={achievements} />

      {/* Section 6: Health Tip */}
      <HealthTip tip={healthTip} />

      {/* Section 7: Emergency Notice (Conditional) */}
      {isHighRisk && <EmergencyNotice />}
    </div>
  );
}