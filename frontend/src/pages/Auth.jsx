import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Mail, Lock, User, ArrowRight, LogIn, UserPlus, AlertCircle, CheckCircle } from "lucide-react";

function Auth() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!isLogin && !form.name) newErrors.name = t.errorName;
    if (!form.email) newErrors.email = t.errorEmail;
    if (!form.email.includes("@")) newErrors.email = t.errorValidEmail;
    if (!form.password) newErrors.password = t.errorPassword;
    if (form.password.length < 6) newErrors.password = t.errorPasswordLength;
    if (!isLogin && form.password !== form.confirm) newErrors.confirm = t.errorPasswordMatch;
    return newErrors;
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setResetError(t.errorEmail);
      return;
    }
    if (!resetEmail.includes("@")) {
      setResetError(t.errorValidEmail);
      return;
    }

    setLoading(true);
    setResetError("");
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSent(false);
        setResetEmail("");
      }, 3000);
    } catch (error) {
      const msg = {
        "auth/user-not-found": t.errorUserNotFound || "এই ইমেইলে কোনো অ্যাকাউন্ট নেই",
        "auth/invalid-email": t.errorValidEmail,
      };
      setResetError(msg[error.code] || t.errorResetFailed || "পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে");
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // . Login - Check if profile is complete
        const userCred = await signInWithEmailAndPassword(auth, form.email, form.password);
        const profileDoc = await getDoc(doc(db, "users", userCred.user.uid));

        if (profileDoc.exists() && profileDoc.data().profileComplete) {
          navigate("/dashboard");
        } else {
          navigate("/welcome");
        }
      } else {
        // . Signup - Create account and save basic info
        const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, "users", userCred.user.uid), {
          name: form.name,
          email: form.email,
          createdAt: new Date().toISOString(),
          profileComplete: false,  // . Will be completed in profile setup
        });
        // . Go to Welcome page
        navigate("/welcome");
      }
    } catch (error) {
      const msg = {
        "auth/email-already-in-use": t.errorEmailInUse || "এই ইমেইল আগেই registered",
        "auth/user-not-found": t.errorUserNotFound || "account পাওয়া যায়নি",
        "auth/wrong-password": t.errorWrongPassword || "পাসওয়ার্ড ভুল",
        "auth/invalid-email": t.errorValidEmail,
        "auth/invalid-credential": t.errorInvalidCredential || "ইমেইল বা পাসওয়ার্ড ভুল",
        "auth/network-request-failed": t.errorNetwork || "internet connection চেক করুন",
        "auth/too-many-requests": "অনেক বেশি চেষ্টা করেছেন। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
      };
      setErrors({ general: msg[error.code] || `${t.errorGeneral || "সমস্যা"}: ${error.code}` });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse delay-2000"></div>
      </div>

      <div className="relative w-full max-w-md">
        
        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">{t.resetPassword}</h3>
                <button 
                  onClick={() => { setShowForgotPassword(false); setResetError(""); setResetSent(false); }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {resetSent ? (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 font-medium">{t.resetLinkSent}</p>
                  <p className="text-green-600 text-sm mt-1">{t.checkEmail}</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 text-sm mb-4">
                    {t.resetEmailInstruction || "আপনার অ্যাকাউন্টের ইমেইল দিন। পাসওয়ার্ড রিসেট লিংক পাঠিয়ে দেব।"}
                  </p>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder={t.enterEmail}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  {resetError && (
                    <div className="flex items-center gap-2 bg-red-50 rounded-xl p-3 mb-4">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <p className="text-red-600 text-sm">{resetError}</p>
                    </div>
                  )}
                  <button
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all"
                  >
                    {loading ? t.processing : t.sendResetLink}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-8 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl">🩸</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">{t.appName}</h1>
            <p className="text-blue-100 text-sm">{t.appSubtitle}</p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            
            {/* Tab Buttons */}
            <div className="flex gap-3 mb-8 bg-gray-100 p-1.5 rounded-2xl">
              <button
                onClick={() => { setIsLogin(true); setErrors({}); }}
                className={`flex-1 py-3 rounded-xl text-base font-medium transition-all duration-300 flex items-center justify-center gap-2
                  ${isLogin
                    ? "bg-white text-blue-700 shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <LogIn size={18} />
                {t.login}
              </button>
              <button
                onClick={() => { setIsLogin(false); setErrors({}); }}
                className={`flex-1 py-3 rounded-xl text-base font-medium transition-all duration-300 flex items-center justify-center gap-2
                  ${!isLogin
                    ? "bg-white text-blue-700 shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <UserPlus size={18} />
                {t.signup}
              </button>
            </div>

            <div className="space-y-5">

              {/* Name - Signup only */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.fullName}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder={t.enterName}
                      className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.name}
                    </p>
                  )}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t.enterEmailPlaceholder}
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={t.enterPassword}
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password - Signup only */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.confirmPassword}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      name="confirm"
                      value={form.confirm}
                      onChange={handleChange}
                      placeholder={t.reEnterPassword}
                      className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                  {errors.confirm && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.confirm}
                    </p>
                  )}
                </div>
              )}

              {/* Forgot Password Link - Login only */}
              {isLogin && (
                <div className="text-right">
                  <button
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              )}

              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              )}

            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t.processing}
                </>
              ) : (
                <>
                  {isLogin ? t.loginBtn : t.signupBtn}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Footer Note */}
            <p className="text-center text-xs text-gray-400 mt-6">
              {isLogin 
                ? t.noAccount
                : t.alreadyAccount}
            </p>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Auth;