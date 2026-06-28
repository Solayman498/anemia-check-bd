// src/pages/Success.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { CheckCircle, Sparkles, Heart, Activity, Droplet, Brain, ChevronRight, ArrowLeft } from "lucide-react";

function Success() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 transition-all duration-1000 ${animate ? 'translate-x-0' : 'translate-x-20'}`}></div>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 transition-all duration-1000 delay-300 ${animate ? 'translate-x-0' : '-translate-x-20'}`}></div>
      </div>

      <div className={`w-full max-w-md relative z-10 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 pt-12 pb-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></div>
            
            <div className="relative">
              {/* Animated Check */}
              <div className={`relative transition-all duration-1000 ${animate ? 'scale-100 rotate-0' : 'scale-0 rotate-45'}`}>
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle size={52} className="text-white" />
                </div>
                <div className={`absolute -top-2 -right-2 transition-all duration-1000 delay-300 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                  <Sparkles size={24} className="text-yellow-300 animate-spin-slow" />
                </div>
              </div>
              
              <h1 className={`text-2xl font-bold text-white mt-5 transition-all duration-700 delay-200 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {language === "bn" ? "অভিনন্দন! 🎉" : "Congratulations! 🎉"}
              </h1>
              <p className={`text-emerald-100 text-sm mt-2 leading-relaxed transition-all duration-700 delay-300 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {language === "bn" 
                  ? "আপনার প্রোফাইল সফলভাবে সম্পূর্ণ হয়েছে।"
                  : "Your profile has been completed successfully."}
              </p>
              <p className={`text-emerald-200 text-xs mt-1 transition-all duration-700 delay-400 ${animate ? 'opacity-100' : 'opacity-0'}`}>
                {language === "bn" 
                  ? "আপনি এখন আপনার অ্যানিমিয়া স্ক্রিনিং যাত্রা শুরু করতে প্রস্তুত।"
                  : "You are now ready to start your anemia screening journey."}
              </p>
            </div>
          </div>

          {/* Features List */}
          <div className="px-8 py-6">
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-3 ${feature.bg} rounded-xl px-4 py-3 border border-gray-100 transition-all duration-500 delay-${(index + 1) * 100} ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <feature.icon size={16} className={feature.color} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{feature.label}</span>
                  <CheckCircle size={14} className="text-green-500 ml-auto flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Get Started Button */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              {language === "bn" ? "শুরু করুন" : "Get Started"}
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="px-8 py-3 text-center border-t border-gray-100 flex justify-between items-center">
            <button
              onClick={() => navigate("/profile-setup")}
              className="text-xs text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={12} />
              {language === "bn" ? "পিছনে" : "Back"}
            </button>
            <p className="text-xs text-gray-400">
              {language === "bn" ? "ধাপ ৩/৩" : "Step 3/3"}
            </p>
            <div className="w-12"></div> {/* Spacer for alignment */}
          </div>

        </div>
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

export default Success;