// src/pages/ProfileSetup.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ArrowRight, Calendar, User, Weight, MapPin, Baby, Heart, ArrowLeft, Save } from "lucide-react";

const districts = [
  { key: "dhaka", bn: "ঢাকা", en: "Dhaka" },
  { key: "chittagong", bn: "চট্টগ্রাম", en: "Chittagong" },
  { key: "rajshahi", bn: "রাজশাহী", en: "Rajshahi" },
  { key: "khulna", bn: "খুলনা", en: "Khulna" },
  { key: "barisal", bn: "বরিশাল", en: "Barisal" },
  { key: "sylhet", bn: "সিলেট", en: "Sylhet" },
  { key: "rangpur", bn: "রংপুর", en: "Rangpur" },
  { key: "mymensingh", bn: "ময়মনসিংহ", en: "Mymensingh" },
  { key: "comilla", bn: "কুমিল্লা", en: "Comilla" },
  { key: "gazipur", bn: "গাজীপুর", en: "Gazipur" },
  { key: "narayanganj", bn: "নারায়ণগঞ্জ", en: "Narayanganj" },
  { key: "tangail", bn: "টাঙ্গাইল", en: "Tangail" },
  { key: "jamalpur", bn: "জামালপুর", en: "Jamalpur" },
  { key: "netrokona", bn: "নেত্রকোনা", en: "Netrokona" },
  { key: "kishoreganj", bn: "কিশোরগঞ্জ", en: "Kishoreganj" },
  { key: "manikganj", bn: "মানিকগঞ্জ", en: "Manikganj" },
  { key: "munshiganj", bn: "মুন্সীগঞ্জ", en: "Munshiganj" },
  { key: "rajbari", bn: "রাজবাড়ী", en: "Rajbari" },
  { key: "madaripur", bn: "মাদারীপুর", en: "Madaripur" },
  { key: "gopalganj", bn: "গোপালগঞ্জ", en: "Gopalganj" },
  { key: "faridpur", bn: "ফরিদপুর", en: "Faridpur" },
  { key: "shariatpur", bn: "শরীয়তপুর", en: "Shariatpur" },
  { key: "brahmanbaria", bn: "ব্রাহ্মণবাড়িয়া", en: "Brahmanbaria" },
  { key: "chandpur", bn: "চাঁদপুর", en: "Chandpur" },
  { key: "lakshmipur", bn: "লক্ষ্মীপুর", en: "Lakshmipur" },
  { key: "noakhali", bn: "নোয়াখালী", en: "Noakhali" },
  { key: "feni", bn: "ফেনী", en: "Feni" },
  { key: "khagrachhari", bn: "খাগড়াছড়ি", en: "Khagrachhari" },
  { key: "rangamati", bn: "রাঙামাটি", en: "Rangamati" },
  { key: "bandarban", bn: "বান্দরবান", en: "Bandarban" },
  { key: "coxsbazar", bn: "কক্সবাজার", en: "Cox's Bazar" },
  { key: "satkhira", bn: "সাতক্ষীরা", en: "Satkhira" },
  { key: "jashore", bn: "যশোর", en: "Jashore" },
  { key: "jhenaidah", bn: "ঝিনাইদহ", en: "Jhenaidah" },
  { key: "magura", bn: "মাগুরা", en: "Magura" },
  { key: "narail", bn: "নড়াইল", en: "Narail" },
  { key: "kushtia", bn: "কুষ্টিয়া", en: "Kushtia" },
  { key: "chuadanga", bn: "চুয়াডাঙ্গা", en: "Chuadanga" },
  { key: "meherpur", bn: "মেহেরপুর", en: "Meherpur" },
  { key: "bagherhat", bn: "বাগেরহাট", en: "Bagherhat" },
  { key: "pirojpur", bn: "পিরোজপুর", en: "Pirojpur" },
  { key: "jhalakathi", bn: "ঝালকাঠি", en: "Jhalakathi" },
  { key: "barguna", bn: "বরগুনা", en: "Barguna" },
  { key: "patuakhali", bn: "পটুয়াখালী", en: "Patuakhali" },
  { key: "bhola", bn: "ভোলা", en: "Bhola" },
  { key: "pabna", bn: "পাবনা", en: "Pabna" },
  { key: "sirajganj", bn: "সিরাজগঞ্জ", en: "Sirajganj" },
  { key: "bogura", bn: "বগুড়া", en: "Bogura" },
  { key: "joypurhat", bn: "জয়পুরহাট", en: "Joypurhat" },
  { key: "naogaon", bn: "নওগাঁ", en: "Naogaon" },
  { key: "natore", bn: "নাটোর", en: "Natore" },
  { key: "chapainawabganj", bn: "চাঁপাইনবাবগঞ্জ", en: "Chapainawabganj" },
  { key: "dinajpur", bn: "দিনাজপুর", en: "Dinajpur" },
  { key: "thakurgaon", bn: "ঠাকুরগাঁও", en: "Thakurgaon" },
  { key: "panchagarh", bn: "পঞ্চগড়", en: "Panchagarh" },
  { key: "nilphamari", bn: "নীলফামারী", en: "Nilphamari" },
  { key: "lalmonirhat", bn: "লালমনিরহাট", en: "Lalmonirhat" },
  { key: "kurigram", bn: "কুড়িগ্রাম", en: "Kurigram" },
  { key: "gaibandha", bn: "গাইবান্ধা", en: "Gaibandha" },
  { key: "sherpur", bn: "শেরপুর", en: "Sherpur" },
  { key: "habiganj", bn: "হবিগঞ্জ", en: "Habiganj" },
  { key: "moulvibazar", bn: "মৌলভীবাজার", en: "Moulvibazar" },
  { key: "sunamganj", bn: "সুনামগঞ্জ", en: "Sunamganj" },
];

function ProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [animate, setAnimate] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [form, setForm] = useState({
    age: "",
    gender: "",
    pregnant: false,
    weight: "",
    district: "",
  });

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  // . Check if user is logged in and load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          
          // . If profile is complete, set edit mode
          if (data.profileComplete) {
            setIsEditMode(true);
            setForm({
              age: data.age || "",
              gender: data.gender || "",
              pregnant: data.pregnant || false,
              weight: data.weight || "",
              district: data.district || "",
            });
          } else {
            // . New user - from registration flow
            setIsEditMode(false);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
      setInitialLoading(false);
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.age) newErrors.age = t.errorRequired;
    if (form.age < 1 || form.age > 120) newErrors.age = "সঠিক বয়স দিন (১-১২০)";
    if (!form.gender) newErrors.gender = t.errorGender;
    if (!form.weight) newErrors.weight = t.errorWeight;
    if (form.weight < 1 || form.weight > 200) newErrors.weight = "সঠিক ওজন দিন (১-২০০ কেজি)";
    if (!form.district) newErrors.district = t.errorDistrict;
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const uid = auth.currentUser.uid;

      let userType = "adult";
      if (form.age < 18) userType = "child";
      else if (form.gender === "female" && form.age >= 10 && form.age <= 19) userType = "adolescent_girl";
      else if (form.gender === "female" && form.pregnant) userType = "pregnant";

      // . Save or Update profile
      await setDoc(doc(db, "users", uid), {
        age: parseInt(form.age),
        gender: form.gender,
        pregnant: form.pregnant,
        weight: parseFloat(form.weight),
        district: form.district,
        userType: userType,
        profileComplete: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // . If coming from Settings (Edit mode), go back to Settings
      if (isEditMode) {
        navigate("/settings");
      } else {
        // . New user - go to Success
        navigate("/success");
      }

    } catch (error) {
      console.error("Profile save error:", error);
      setErrors({ general: "সমস্যা হয়েছে, আবার চেষ্টা করুন" });
    }

    setLoading(false);
  };

  const handleBack = () => {
    if (isEditMode) {
      navigate("/settings");
    } else {
      navigate("/welcome");
    }
  };

  // Get district display name
  const getDistrictName = (districtKey) => {
    const dist = districts.find(d => d.key === districtKey);
    if (!dist) return districtKey;
    return language === "bn" ? dist.bn : dist.en;
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className={`w-full max-w-lg transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <h1 className="text-xl font-bold">
                {isEditMode 
                  ? (language === "bn" ? "প্রোফাইল আপডেট" : "Update Profile")
                  : (language === "bn" ? "প্রোফাইল সম্পূর্ণ করুন" : "Complete Your Profile")}
              </h1>
            </div>
            <p className="text-blue-100 text-sm mt-1 ml-11">
              {isEditMode
                ? (language === "bn" ? "আপনার ব্যক্তিগত তথ্য আপডেট করুন" : "Update your personal information")
                : (language === "bn" ? "এই তথ্য আমাদের আরও নির্ভুল স্ক্রিনিং ফলাফল দিতে সাহায্য করে。" : "This information helps us provide more accurate screening results.")}
            </p>
          </div>

          {/* Progress Bar - Only for new users */}
          {!isEditMode && (
            <div className="px-8 pt-6">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{language === "bn" ? "প্রোফাইল তথ্য" : "Profile Info"}</span>
                <span>{language === "bn" ? "ধাপ ২/৩" : "Step 2/3"}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: "66%" }}></div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="px-8 py-6 space-y-5">
            
            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                {language === "bn" ? "বয়স" : "Age"} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                placeholder={language === "bn" ? "বয়স লিখুন" : "Enter your age"}
                min="1"
                max="120"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              {errors.age && <p className="text-red-500 text-xs mt-1">⚠️ {errors.age}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                {language === "bn" ? "লিঙ্গ" : "Gender"} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, gender: "female", pregnant: false })}
                  className={`py-3 rounded-xl border text-sm font-medium transition ${
                    form.gender === "female"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {language === "bn" ? "মহিলা" : "Female"}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, gender: "male", pregnant: false })}
                  className={`py-3 rounded-xl border text-sm font-medium transition ${
                    form.gender === "male"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {language === "bn" ? "পুরুষ" : "Male"}
                </button>
              </div>
              {errors.gender && <p className="text-red-500 text-xs mt-1">⚠️ {errors.gender}</p>}
            </div>

            {/* Pregnancy */}
            {form.gender === "female" && form.age >= 10 && (
              <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="pregnant"
                    checked={form.pregnant}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
                      <Heart size={14} className="text-pink-500" />
                      {language === "bn" ? "আমি গর্ভবতী" : "I am pregnant"}
                    </span>
                    <p className="text-xs text-pink-600 mt-0.5">
                      {language === "bn" ? "গর্ভবতী মহিলাদের জন্য বিশেষ স্ক্রিনিং" : "Special screening for pregnant women"}
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <Weight size={14} className="text-gray-400" />
                {language === "bn" ? "ওজন (কেজি)" : "Weight (kg)"} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                placeholder={language === "bn" ? "যেমন: ৫৫" : "e.g. 55"}
                min="1"
                max="200"
                step="0.1"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              {errors.weight && <p className="text-red-500 text-xs mt-1">⚠️ {errors.weight}</p>}
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                {language === "bn" ? "জেলা" : "District"} <span className="text-red-500">*</span>
              </label>
              <select
                name="district"
                value={form.district}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-white"
              >
                <option value="">{language === "bn" ? "জেলা নির্বাচন করুন" : "Select District"}</option>
                {districts.map((d) => (
                  <option key={d.key} value={d.key}>
                    {language === "bn" ? d.bn : d.en}
                  </option>
                ))}
              </select>
              {errors.district && <p className="text-red-500 text-xs mt-1">⚠️ {errors.district}</p>}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                <p className="text-red-600 text-sm text-center">⚠️ {errors.general}</p>
              </div>
            )}

          </div>

          {/* Buttons */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {language === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving..."}
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <>
                      <Save size={16} />
                      {language === "bn" ? "আপডেট করুন" : "Update"}
                    </>
                  ) : (
                    <>
                      {language === "bn" ? "প্রোফাইল সংরক্ষণ করুন" : "Save Profile"}
                      <ArrowRight size={16} />
                    </>
                  )}
                </>
              )}
            </button>
          </div>

        </div>

        {/* Footer - Only for new users */}
        {!isEditMode && (
          <p className="text-center text-xs text-gray-400 mt-4">
            {language === "bn" ? "ধাপ ২/৩" : "Step 2/3"}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProfileSetup;