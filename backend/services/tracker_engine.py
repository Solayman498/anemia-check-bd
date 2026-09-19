from typing import List, Dict, Any, Optional

SYMPTOM_REASON_KEYS = {
    "fatigue": "symptom_reason_fatigue",
    "dizziness": "symptom_reason_dizziness",
    "breathless": "symptom_reason_breathless",
    "pale_eyes": "symptom_reason_pale_eyes",
    "headache": "symptom_reason_headache",
    "heartbeat": "symptom_reason_heartbeat",
    "concentration": "symptom_reason_concentration",
    "swelling": "symptom_reason_swelling",
    "nausea": "symptom_reason_nausea",
    "abdominal_pain": "symptom_reason_ab_pain",
    "bleeding": "symptom_reason_bleeding"
}

SYMPTOM_NAME_MAP = {
    "fatigue": "Fatigue",
    "dizziness": "Dizziness",
    "swelling": "Foot Swelling",
    "breathless": "Breathlessness",
    "heartbeat": "Heart Palpitations",
    "headache": "Headache",
    "pale_eyes": "Pale Eyes/Skin",
    "concentration": "Concentration Issues",
    "nausea": "Nausea / Morning Sickness",
    "abdominal_pain": "Abdominal Pain",
    "bleeding": "Vaginal Bleeding"
}

SYMPTOM_NAME_MAP_BN = {
    "fatigue": "ক্লান্তি",
    "dizziness": "মাথা ঘোরা",
    "swelling": "পায়ে পানি আসা / ফোলাভাব",
    "breathless": "শ্বাসকষ্ট",
    "heartbeat": "বুক ধড়ফড়",
    "headache": "মাথাব্যথা",
    "pale_eyes": "চোখ বা ত্বক ফ্যাকাশে হওয়া",
    "concentration": "মনোযোগের অভাব",
    "nausea": "বমি বমি ভাব",
    "abdominal_pain": "তলপেটে ব্যথা",
    "bleeding": "রক্তপাত"
}


class TrackerRuleEngine:
    
    SEVERITY_MAP = {
        0: {"key": "none", "color": "gray"},
        1: {"key": "mild", "color": "green"},
        2: {"key": "moderate", "color": "yellow"},
        3: {"key": "severe", "color": "red"}
    }
    
    HB_ANEMIA_THRESHOLD = 11.0
    HB_SEVERE_ANEMIA_THRESHOLD = 7.0

    def __init__(self):
        self.reason_keys = SYMPTOM_REASON_KEYS
        self.name_map = SYMPTOM_NAME_MAP
        self.name_map_bn = SYMPTOM_NAME_MAP_BN

    def _sanitize_score(self, val: Optional[Any]) -> Optional[float]:
        if val is None:
            return None
        try:
            score = float(val)
            return max(0.0, min(10.0, score))
        except (ValueError, TypeError):
            return None

    def prepare_today_symptoms(self, existing_intensities: Dict[str, int], new_intensities: Dict[str, int]):
        merged_intensities = existing_intensities.copy() if existing_intensities else {}
        for symptom, intensity in new_intensities.items():
            if intensity > 0:
                merged_intensities[symptom] = intensity
            elif symptom in merged_intensities and intensity == 0:
                del merged_intensities[symptom]
        
        symptoms_list = list(merged_intensities.keys())
        
        if not merged_intensities:
            calculated_score = 0.0
        else:
            total_intensity = sum(merged_intensities.values())
            count = len(merged_intensities)
            has_severe = any(i == 3 for i in merged_intensities.values())
            danger_symptoms = ["bleeding", "abdominal_pain", "headache", "heartbeat"]
            has_danger = any(s in merged_intensities for s in danger_symptoms)

            danger_weight = 3.5 if (has_severe or has_danger) else 0.0
            calculated_score = round(min(10.0, (total_intensity * 1.5) + (count * 0.8) + danger_weight), 1)

            if has_severe and has_danger:
                calculated_score = max(calculated_score, 7.2)

        return calculated_score, symptoms_list, merged_intensities

    def _get_hb_status_bn(self, current_hb: Optional[float], hb_trend: Optional[str]) -> str:
        if current_hb is None:
            return ""
        
        hb_info = f"আপনার বর্তমান হিমোগ্লোবিন (Hb) লেভেল {current_hb} g/dL।"
        
        if current_hb < self.HB_SEVERE_ANEMIA_THRESHOLD:
            return f"{hb_info} এটি মারাত্মক রক্তস্বল্পতা (Severe Anemia) নির্দেশ করে।"
        elif current_hb < self.HB_ANEMIA_THRESHOLD:
            if hb_trend == "decreasing":
                return f"{hb_info} আপনার Hb লেভেল ক্রমশ হ্রাস পাচ্ছে, যা রক্তস্বল্পতার ঝুঁকি বাড়াচ্ছে।"
            elif hb_trend == "improving":
                return f"{hb_info} আপনার রক্তস্বল্পতা থাকলেও Hb লেভেল আগের চেয়ে উন্নতির দিকে।"
            else:
                return f"{hb_info} এটি হালকা থেকে মাঝারি রক্তস্বল্পতা নির্দেশ করে।"
        else:
            if hb_trend == "decreasing":
                return f"{hb_info} Hb স্বাভাবিক থাকলেও আগের তুলনায় কিছুটা কমেছে।"
            return f"{hb_info} আপনার রক্তে হিমোগ্লোবিনের পরিমাণ স্বাভাবিক আছে।"

    def _get_hb_status_en(self, current_hb: Optional[float], hb_trend: Optional[str]) -> str:
        if current_hb is None:
            return ""
        
        hb_info = f"Your current Hemoglobin (Hb) level is {current_hb} g/dL."
        
        if current_hb < self.HB_SEVERE_ANEMIA_THRESHOLD:
            return f"{hb_info} This indicates severe anemia."
        elif current_hb < self.HB_ANEMIA_THRESHOLD:
            if hb_trend == "decreasing":
                return f"{hb_info} Your Hb level is decreasing, increasing the risk of anemia."
            elif hb_trend == "improving":
                return f"{hb_info} Although you have mild anemia, your Hb trend is improving."
            else:
                return f"{hb_info} This indicates mild to moderate anemia."
        else:
            if hb_trend == "decreasing":
                return f"{hb_info} Your Hb level is normal but shows a declining trend."
            return f"{hb_info} Your hemoglobin level is within the normal range."

    def _build_professional_summary_bn(self, symptom_count, symptom_details, trend, status, score, previous_score, current_hb, hb_trend):
        severity_map = {"mild": "হালকা", "moderate": "মাঝারি", "severe": "তীব্র", "none": ""}
        symptom_parts = []
        has_severe_symptom = False

        for s in symptom_details:
            name = self.name_map_bn.get(s["name"], s["name"])
            severity_key = s.get("severity_key", "")
            severity = severity_map.get(severity_key, "")
            
            if severity_key == "severe" or s["name"] in ["bleeding", "abdominal_pain"]:
                has_severe_symptom = True

            if severity:
                symptom_parts.append(f"{severity} {name}")
            else:
                symptom_parts.append(name)
        
        symptom_text = ", ".join(symptom_parts) if symptom_parts else "কোনো উপসর্গ নেই"
        curr_score = self._sanitize_score(score) or 0.0
        prev_score = self._sanitize_score(previous_score)
        
        if has_severe_symptom or (current_hb and current_hb < self.HB_SEVERE_ANEMIA_THRESHOLD):
            curr_score = max(curr_score, 7.2)

        hb_summary_text = self._get_hb_status_bn(current_hb, hb_trend)

        if curr_score >= 7.0:
            score_level = "উচ্চ"
            score_desc = "গর্ভকালীন সময়ে আপনার বর্তমান শারীরিক লক্ষণগুলো অত্যন্ত উদ্বেগজনক।"
        elif curr_score >= 3.5 or (current_hb and current_hb < self.HB_ANEMIA_THRESHOLD):
            score_level = "মাঝারি"
            score_desc = "আপনার লক্ষণ ও স্বাস্থ্যগত অবস্থা মাঝারি সতর্কতার পর্যায়ে রয়েছে।"
        else:
            score_level = "কম"
            score_desc = "আপনার গর্ভাবস্থার বর্তমান লক্ষণগুলো মৃদু।"
        
        score_diff = round(curr_score - prev_score, 1) if prev_score is not None else 0.0
        
        if prev_score is None or trend.get("key") == "first_log":
            trend_text = "এটি গর্ভাবস্থায় আপনার প্রথম ট্র্যাকিং লগ।"
        else:
            abs_diff = abs(score_diff)
            if abs_diff <= 0.5:
                trend_text = "পূর্ববর্তী ট্র্যাকিংয়ের তুলনায় শারীরিক অবস্থা স্থিতিশীল।"
            elif curr_score > prev_score:
                trend_text = f"গত ট্র্যাকিংয়ের চেয়ে আপনার উপসর্গগুলোর মাত্রা {abs_diff} পয়েন্ট বেড়েছে।"
            else:
                trend_text = f"গত ট্র্যাকিংয়ের চেয়ে আপনার শারীরিক অস্বস্তি {abs_diff} পয়েন্ট কমেছে।"

        if curr_score >= 7.0 or has_severe_symptom or (current_hb and current_hb < self.HB_SEVERE_ANEMIA_THRESHOLD):
            status_desc = "জরুরি সতর্কতা: আপনার ও গর্ভস্থ শিশুর নিরাপত্তার স্বার্থে বিলম্ব না করে অবিলম্বে আপনার গাইনি চিকিৎসক বা নিকটস্থ হাসপাতালের জরুরি বিভাগে যোগাযোগ করুন।"
        elif curr_score >= 3.5 or (current_hb and current_hb < self.HB_ANEMIA_THRESHOLD):
            status_desc = "পরামর্শ: অবহেলা না করে লক্ষণগুলোর দিকে সতর্ক নজর রাখুন এবং চিকিৎসকের পরামর্শ অনুযায়ী পুষ্টিকর খাবার ও ওষুধ গ্রহণ করুন।"
        elif prev_score is not None and score_diff >= 1.0:
            status_desc = "পরামর্শ: যদিও লক্ষণগুলোর তীব্রতা বর্তমানে কম, তবে এটি ঊর্ধ্বমুখী দেখাচ্ছে। শারীরিক অবস্থা পর্যবেক্ষণে রাখুন এবং প্রয়োজনবোধে চিকিৎসকের পরামর্শ নিন।"
        else:
            status_desc = "পরামর্শ: আপনার গর্ভাবস্থা নিয়ন্ত্রণে রয়েছে। নিয়মিত পুষ্টিকর খাবার ও গর্ভকালীন যত্ন (ANC) বজায় রাখুন।"
        
        hb_part = f"\n{hb_summary_text}" if hb_summary_text else ""
        
        if symptom_count == 0:
            return f"আজকে আপনি কোনো অস্বস্তিকর লক্ষণ জানাননি।{hb_part}\n{status_desc}"
        
        return f"আজকে গর্ভকালীন {symptom_count}টি লক্ষণ রেকর্ড করা হয়েছে: {symptom_text}।\n{score_desc} বর্তমান লক্ষণ স্কোর {curr_score}/১০ ({score_level} পর্যায়)।{hb_part}\n{trend_text}\n{status_desc}"

    def _build_professional_summary_en(self, symptom_count, symptom_details, trend, status, score, previous_score, current_hb, hb_trend):
        severity_map = {"mild": "mild", "moderate": "moderate", "severe": "severe", "none": ""}
        symptom_parts = []
        has_severe_symptom = False

        for s in symptom_details:
            name = self.name_map.get(s["name"], s["name"])
            severity_key = s.get("severity_key", "")
            severity = severity_map.get(severity_key, "")
            
            if severity_key == "severe" or s["name"] in ["bleeding", "abdominal_pain"]:
                has_severe_symptom = True

            if severity:
                symptom_parts.append(f"{severity} {name.lower()}")
            else:
                symptom_parts.append(name)
        
        symptom_text = ", ".join(symptom_parts) if symptom_parts else "No symptoms"
        curr_score = self._sanitize_score(score) or 0.0
        prev_score = self._sanitize_score(previous_score)
        
        if has_severe_symptom or (current_hb and current_hb < self.HB_SEVERE_ANEMIA_THRESHOLD):
            curr_score = max(curr_score, 7.2)

        hb_summary_text = self._get_hb_status_en(current_hb, hb_trend)

        if curr_score >= 7.0:
            score_level = "high"
            score_desc = "Your symptoms during pregnancy require immediate attention."
        elif curr_score >= 3.5 or (current_hb and current_hb < self.HB_ANEMIA_THRESHOLD):
            score_level = "moderate"
            score_desc = "Your symptoms and health parameters are at a moderate risk level."
        else:
            score_level = "low"
            score_desc = "Your current symptoms appear mild."
        
        score_diff = round(curr_score - prev_score, 1) if prev_score is not None else 0.0

        if prev_score is None or trend.get("key") == "first_log":
            trend_text = "This is your first pregnancy health log."
        else:
            abs_diff = abs(score_diff)
            if abs_diff <= 0.5:
                trend_text = "Your condition remains stable compared to the last log."
            elif curr_score > prev_score:
                trend_text = f"Your symptom intensity increased by {abs_diff} points."
            else:
                trend_text = f"Your symptoms improved by {abs_diff} points."

        if curr_score >= 7.0 or has_severe_symptom or (current_hb and current_hb < self.HB_SEVERE_ANEMIA_THRESHOLD):
            status_desc = "Urgent Advisory: For your and your baby's safety, please consult your gynecologist or visit an emergency care facility immediately."
        elif curr_score >= 3.5 or (current_hb and current_hb < self.HB_ANEMIA_THRESHOLD):
            status_desc = "Advisory: Keep a close eye on symptoms, maintain an iron-rich diet, and follow your doctor's recommendations."
        elif prev_score is not None and score_diff >= 1.0:
            status_desc = "Advisory: Although your symptoms are currently mild, they show an upward trend. Monitor them closely and consult your healthcare provider if they persist."
        else:
            status_desc = "Advisory: Your health condition is stable. Continue regular prenatal care and healthy habits."
        
        hb_part = f"\n{hb_summary_text}" if hb_summary_text else ""
        
        if symptom_count == 0:
            return f"You reported no pregnancy discomforts today.{hb_part}\n{status_desc}"
        
        return f"You reported {symptom_count} pregnancy symptoms: {symptom_text}.\n{score_desc} Current score: {curr_score}/10 ({score_level} level).{hb_part}\n{trend_text}\n{status_desc}"

    def _build_professional_advice_bn(self, symptoms, trend, status, risk, current_hb, hb_trend):
        recs = []
        
        if current_hb is not None:
            if current_hb < self.HB_ANEMIA_THRESHOLD:
                recs.append("ডাক্তারের পরামর্শে নিয়মিত আইরন ও ফলিক এসিড (Iron & Folic Acid) ট্যাবলেট গ্রহণ করুন।")
                recs.append("কচু শাক, কলিজা, ডাল, ডিম এবং ভিটামিন-সি যুক্ত ফল বেশি খান।")
            elif hb_trend == "decreasing":
                recs.append("আপনার হিমোগ্লোবিন ট্রেন্ড নিম্নমুখী; আয়রন সমৃদ্ধ খাবার বাড়িয়ে দিন এবং পর্যাপ্ত বিশ্রাম নিন।")

        if status["key"] == "good":
            recs.append("গর্ভকালীন সময়ে নিয়মিত স্বাস্থ্যকর খাবার ও ফলমূল গ্রহণ করুন।")
            recs.append("প্রতিদিন পর্যাপ্ত পানি পান করুন (৩ লিটার)।")
            recs.append("হালকা হাঁটাহাঁটি করুন এবং নিয়মিত ANC চেকআপ করান।")
        elif status["key"] == "attention":
            recs.append("গর্ভাবস্থায় পর্যাপ্ত বিশ্রাম নিন (রাতে অন্তত ৮ ঘন্টা ও দিনে ২ ঘন্টা)।")
            
            if "fatigue" in symptoms or "pale_eyes" in symptoms:
                recs.append("প্রচণ্ড ক্লান্তি বা ফ্যাকাশে ভাব অ্যানিমিয়ার লক্ষণ হতে পারে; Hb পরীক্ষা করানো নিশ্চিত করুন।")
            if "headache" in symptoms or "dizziness" in symptoms:
                recs.append("মাথাব্যথা বা মাথা ঘোরার ক্ষেত্রে প্রেশার মেপে নিশ্চিত হোন এবং দ্রুত বিশ্রাম নিন।")
            if "swelling" in symptoms:
                recs.append("পায়ে পানি আসলে বসার সময় পা উঁচুতে রাখুন এবং খাবারে অতিরিক্ত কাঁচা লবণ এড়িয়ে চলুন।")
            if "breathless" in symptoms:
                recs.append("শ্বাসকষ্ট হলে ভারী কাজ থেকে বিরত থাকুন এবং কিছুটা পিঠ উঁচুতে রেখে বিশ্রাম নিন।")
            if "nausea" in symptoms:
                recs.append("বমি ভাব কমাতে সকালে শুকনো খাবার (যেমন বিস্কুট) খান এবং বারে বারে অল্প পরিমাণে খান।")
                
            if trend.get("key") in ["worsening", "critical"]:
                recs.append("উপসর্গ বাড়লে বিলম্ব না করে আপনার রেজিস্টার্ড গাইনি চিকিৎসকের পরামর্শ নিন।")
        else:
            recs.append("অবিলম্বে নিবন্ধিত গাইনি চিকিৎসক বা গর্ভাবস্থার জরুরি সেবা কেন্দ্রে যান।")
            recs.append("সব ধরনের কঠোর পরিশ্রম বন্ধ করে পুর্ণ বিশ্রামে থাকুন।")
            recs.append("জরুরি লক্ষণগুলো (যেমন রক্তপাত, তীব্র পেট ব্যথা) নোট করে ডাক্তারকে বিস্তারিত বলুন।")
        
        return recs[:6]

    def _build_professional_advice_en(self, symptoms, trend, status, risk, current_hb, hb_trend):
        recs = []
        
        if current_hb is not None:
            if current_hb < self.HB_ANEMIA_THRESHOLD:
                recs.append("Take prescribed Iron and Folic Acid supplements regularly.")
                recs.append("Increase intake of iron-rich foods (dark leafy greens, eggs, pulses) along with Vitamin C.")
            elif hb_trend == "decreasing":
                recs.append("Your Hb trend shows a decline; focus on an iron-fortified diet and rest.")

        if status["key"] == "good":
            recs.append("Maintain a balanced prenatal diet with fruits and proteins.")
            recs.append("Drink plenty of fluids (approx. 3 liters daily).")
            recs.append("Continue light exercise and schedule regular ANC visits.")
        elif status["key"] == "attention":
            recs.append("Get adequate rest (at least 8 hours of sleep at night and 2 hours during the day).")
            
            if "fatigue" in symptoms or "pale_eyes" in symptoms:
                recs.append("Fatigue or paleness can indicate anemia; check your Hb level.")
            if "headache" in symptoms or "dizziness" in symptoms:
                recs.append("For headaches or dizziness, check your blood pressure and rest immediately.")
            if "swelling" in symptoms:
                recs.append("Elevate your legs while sitting and reduce extra raw salt intake.")
            if "breathless" in symptoms:
                recs.append("Avoid heavy activities and rest in a slightly elevated position.")
            if "nausea" in symptoms:
                recs.append("Eat small, frequent meals and dry snacks like crackers for morning sickness.")
                
            if trend.get("key") in ["worsening", "critical"]:
                recs.append("Consult your healthcare provider if symptoms continue to escalate.")
        else:
            recs.append("Contact your registered gynecologist or emergency maternity unit immediately.")
            recs.append("Avoid all physical exertion and take complete bed rest.")
            recs.append("Note down all severe symptoms (e.g., bleeding or sharp pain) for the doctor.")
        
        return recs[:6]

    def analyze(self, symptom_score: float, symptoms: List[str],
                symptom_intensities: Dict[str, int],
                previous_score: Optional[float] = None,
                previous_symptom_count: int = 0,
                current_hb: Optional[float] = None,
                hb_trend: Optional[str] = None,
                language: str = "en") -> Dict[str, Any]:
        
        curr_score = self._sanitize_score(symptom_score) or 0.0
        prev_score = self._sanitize_score(previous_score)
        
        symptom_count = len(symptoms)
        total_intensity = sum(symptom_intensities.values())
        
        has_severe = any(val >= 3 for val in symptom_intensities.values())
        has_danger_symptom = any(s in symptoms for s in ["bleeding", "abdominal_pain", "headache", "heartbeat"])
        is_danger_sign = has_severe or (has_danger_symptom and curr_score >= 5.0)

        if has_severe and has_danger_symptom:
            curr_score = max(curr_score, 7.2)
        
        if curr_score <= 3.0 and not is_danger_sign:
            score_level = "low"
        elif curr_score <= 6.5 and not is_danger_sign:
            score_level = "moderate"
        else:
            score_level = "high"
        
        if symptom_count == 0 and (current_hb is None or current_hb >= self.HB_ANEMIA_THRESHOLD):
            status = {"key": "good", "color": "green"}
        elif curr_score < 6.5 and not is_danger_sign and (current_hb is None or current_hb >= self.HB_SEVERE_ANEMIA_THRESHOLD):
            status = {"key": "attention", "color": "yellow"}
        else:
            status = {"key": "warning", "color": "red"}
        
        if prev_score is None:
            trend = {"key": "first_log", "icon": "•"}
        else:
            score_diff = round(curr_score - prev_score, 1)
            symptom_diff = symptom_count - previous_symptom_count
            
            if score_diff > 0.5 or is_danger_sign:
                if score_diff >= 2.0 or symptom_diff >= 2 or is_danger_sign:
                    trend = {"key": "critical", "icon": "🔴"}
                else:
                    trend = {"key": "worsening", "icon": "🟡"}
            elif score_diff < -0.5:
                if score_diff <= -2.0 or symptom_diff <= -2:
                    trend = {"key": "strongly_improving", "icon": "🟢"}
                else:
                    trend = {"key": "improving", "icon": "🟢"}
            else:
                trend = {"key": "stable", "icon": "⚪"}
        
        if symptom_count == 0 and (current_hb is None or current_hb >= self.HB_ANEMIA_THRESHOLD):
            risk = {"key": "low", "level": "low"}
        elif curr_score < 6.5 and not is_danger_sign:
            risk = {"key": "moderate", "level": "moderate"}
        else:
            risk = {"key": "high", "level": "high"}
        
        symptom_details = []
        for symptom in symptoms:
            intensity = symptom_intensities.get(symptom, 1)
            severity = self.SEVERITY_MAP.get(intensity, self.SEVERITY_MAP[1])
            symptom_details.append({
                "name": symptom,
                "intensity": intensity,
                "severity_key": severity["key"],
                "color": severity["color"]
            })
        
        reason_keys = [self.reason_keys[symptom] for symptom in symptoms if symptom in self.reason_keys]
        
        if str(language).lower().startswith("bn") or str(language).lower() == "bangla":
            summary = self._build_professional_summary_bn(
                symptom_count, symptom_details, trend, status, curr_score, prev_score, current_hb, hb_trend
            )
            advice = self._build_professional_advice_bn(symptoms, trend, status, risk, current_hb, hb_trend)
        else:
            summary = self._build_professional_summary_en(
                symptom_count, symptom_details, trend, status, curr_score, prev_score, current_hb, hb_trend
            )
            advice = self._build_professional_advice_en(symptoms, trend, status, risk, current_hb, hb_trend)
        
        return {
            "score": curr_score,
            "score_level": score_level,
            "status": status,
            "trend": trend,
            "risk": risk,
            "symptom_count": symptom_count,
            "total_intensity": total_intensity,
            "symptom_details": symptom_details,
            "reason_keys": reason_keys[:4],
            "previous_score": prev_score,
            "current_hb": current_hb,
            "hb_trend": hb_trend,
            "summary": summary,
            "advice": advice
        }