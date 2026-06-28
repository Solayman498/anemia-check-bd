// src/pages/Welcome.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { Heart, Shield, ChevronRight, Globe, Sparkles, Activity, Droplet, Brain, User, Calendar, Weight, MapPin } from "lucide-react";

function Welcome() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language || "en");
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setLanguage(lang);
  };

  const handleContinue = () => {
    navigate("/profile-setup");
  };

  // Features for bottom section
  const features = [
    { 
      icon: Heart, 
      label: language === "bn" ? "ব্যক্তিগতকৃত স্ক্রিনিং" : "Personalized Screening", 
      color: "text-rose-500", 
      bg: "bg-rose-50" 
    },
    { 
      icon: Activity, 
      label: language === "bn" ? "দৈনিক লক্ষণ ট্র্যাকিং" : "Daily Symptom Tracking", 
      color: "text-blue-500", 
      bg: "bg-blue-50" 
    },
    { 
      icon: Droplet, 
      label: language === "bn" ? "এইচবি মনিটরিং" : "HB Monitoring", 
      color: "text-red-500", 
      bg: "bg-red-50" 
    },
    { 
      icon: Brain, 
      label: language === "bn" ? "এআই স্বাস্থ্য বিশ্লেষণ" : "AI Health Insights", 
      color: "text-purple-500", 
      bg: "bg-purple-50" 
    },
  ];

  // Profile steps
  const steps = [
    { icon: User, label: language === "bn" ? "ব্যক্তিগত তথ্য" : "Personal Info" },
    { icon: Calendar, label: language === "bn" ? "বয়স" : "Age" },
    { icon: Weight, label: language === "bn" ? "ওজন" : "Weight" },
    { icon: MapPin, label: language === "bn" ? "জেলা" : "District" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 transition-all duration-1000 ${animate ? 'translate-x-0' : 'translate-x-20'}`}></div>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 transition-all duration-1000 delay-300 ${animate ? 'translate-x-0' : '-translate-x-20'}`}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-5 transition-all duration-1000 delay-600 ${animate ? 'scale-100' : 'scale-50'}`}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Main Card */}
        <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 pt-12 pb-10 text-center relative overflow-hidden">
            {/* Animated Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></div>
            
            <div className="relative">
              {/* Animated Icon */}
              <div className={`w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto shadow-lg transition-all duration-1000 ${animate ? 'scale-100 rotate-0' : 'scale-0 rotate-45'}`}>
                <Heart size={40} className="text-white animate-pulse" fill="currentColor" />
              </div>
              
              {/* Sparkle Effect */}
              <div className={`absolute -top-2 -right-2 transition-all duration-1000 delay-300 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                <Sparkles size={24} className="text-yellow-300 animate-spin-slow" />
              </div>
              
              <h1 className={`text-2xl font-bold text-white mt-5 transition-all duration-700 delay-200 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {language === "bn" ? "AnemiaCheck-BD-তে আপনাকে স্বাগতম" : "Welcome to AnemiaCheck-BD"}
              </h1>
              
              <p className={`text-blue-100 text-sm mt-3 leading-relaxed transition-all duration-700 delay-300 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {language === "bn" 
                  ? "ব্যক্তিগতকৃত অ্যানিমিয়া স্ক্রিনিং ও স্বাস্থ্য পর্যবেক্ষণ সেবার জন্য আপনার কিছু তথ্য প্রয়োজন।"
                  : "To provide personalized anemia screening and health tracking, we need a few basic details."}
              </p>
              
              <div className={`mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full transition-all duration-700 delay-400 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                <span className="text-blue-200 text-xs">
                  {language === "bn" ? "⏱ সম্পূর্ণ করতে মাত্র ১ মিনিট" : "⏱ Takes about 1 minute"}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            
            {/* Language Selection */}
            <div className={`mb-6 transition-all duration-700 delay-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={16} className="text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  {language === "bn" ? "ভাষা নির্বাচন করুন" : "Select Language"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-1.5 flex gap-1 border border-gray-200">
                <button
                  onClick={() => handleLanguageChange("en")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedLanguage === "en"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange("bn")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedLanguage === "bn"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            {/* What to expect - Quick Steps */}
            <div className={`mb-5 transition-all duration-700 delay-550 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <p className="text-xs font-medium text-gray-500 mb-2">
                {language === "bn" ? "আপনার যা প্রয়োজন:" : "What you'll need:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-100">
                    <step.icon size={12} className="text-blue-500" />
                    <span className="text-[10px] text-gray-600">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Preview */}
            <div className={`grid grid-cols-2 gap-2 mb-5 transition-all duration-700 delay-600 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {features.map((feature, index) => (
                <div key={index} className={`${feature.bg} rounded-xl px-3 py-2.5 text-center border border-gray-100`}>
                  <feature.icon size={18} className={`${feature.color} mx-auto mb-1`} />
                  <p className="text-[10px] text-gray-600 font-medium leading-tight">{feature.label}</p>
                </div>
              ))}
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group transition-all duration-700 delay-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {language === "bn" ? "চালিয়ে যান" : "Continue"}
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Security Note */}
            <div className={`mt-4 flex items-start gap-3 bg-blue-50 rounded-xl p-3 border border-blue-100 transition-all duration-700 delay-800 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Shield size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                {language === "bn" 
                  ? "🔒 আপনার তথ্য নিরাপদে সংরক্ষণ করা হয় এবং শুধুমাত্র আপনার স্ক্রিনিং অভিজ্ঞতা ব্যক্তিগতকরণের জন্য ব্যবহার করা হয়।"
                  : "🔒 Your information is securely stored and used only to personalize your screening experience."}
              </p>
            </div>

            {/* Already have account? */}
            <div className={`mt-4 text-center transition-all duration-700 delay-850 ${animate ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={() => navigate("/")}
                className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
              >
                {language === "bn" ? "← লগইন পৃষ্ঠায় ফিরুন" : "← Back to Login"}
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <p className={`text-center text-xs text-gray-400 mt-4 transition-all duration-700 delay-900 ${animate ? 'opacity-100' : 'opacity-0'}`}>
          {language === "bn" ? "ধাপ ১/৩" : "Step 1/3"}
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default Welcome;