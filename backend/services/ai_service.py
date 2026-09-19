# services/ai_service.py
from __future__ import annotations
import os
import json
import re
from typing import Any
from dotenv import load_dotenv

load_dotenv()

# ===========================================================================
# ANEMIA DIAGNOSIS - RULE BASED & PREGNANCY AWARE
# ===========================================================================

_SYMPTOM_ALIASES = {
    "heartbeat": "palpitations",
    "fast_heartbeat": "palpitations",
    "breathless": "shortness_of_breath",
    "breathlessness": "shortness_of_breath",
    "poor_concentration": "difficulty_concentrating",
    "concentration": "difficulty_concentrating",
    "pale_eyes": "pale_skin",
    "pale_nails": "pale_skin",
    "tired": "fatigue",
    "fatigue_feeling": "fatigue",
    "weak": "weakness",
    "head_pain": "headache",
    "loss_appetite": "loss_of_appetite",
    "ice_craving": "craving_ice",
}

_SYMPTOM_EXPLANATIONS_BN = {
    "fatigue": {"title": "ক্লান্তি", "reason": "রক্তে হিমোগ্লোবিন কম থাকলে কোষে অক্সিজেন সরবরাহ কমে যায়, ফলে পেশি ও মস্তিষ্কে শক্তি উৎপাদন (ATP) কমে এবং অতিরিক্ত ক্লান্তি অনুভব হয়।"},
    "weakness": {"title": "দুর্বলতা", "reason": "অক্সিজেন ঘাটতির কারণে পেশির কার্যক্ষমতা কমে যায়, শরীর স্বাভাবিক কাজকর্ম করতে পারে না।"},
    "dizziness": {"title": "মাথা ঘোরা", "reason": "মস্তিষ্কে অক্সিজেন প্রবাহ কমলে ভেস্টিবুলার সিস্টেম প্রভাবিত হয়, ফলে ভারসাম্যহীনতা ও মাথা ঘোরা দেখা দেয়।"},
    "shortness_of_breath": {"title": "শ্বাসকষ্ট", "reason": "শরীর অক্সিজেনের ঘাটতি পূরণ করতে শ্বাসের হার বাড়িয়ে দেয়, ফলে সামান্য পরিশ্রমেই শ্বাসকষ্ট অনুভূত হয়।"},
    "pale_skin": {"title": "ত্বক, নখ বা চোখের পাতা ফ্যাকাশে হওয়া", "reason": "রক্তে হিমোগ্লোবিনের মাত্রা কমে গেলে ত্বক, নখ এবং চোখের পাতার ভেতরের অংশ স্বাভাবিকের তুলনায় ফ্যাকাশে দেখাতে পারে।"},
    "cold_hands": {"title": "হাত-পা ঠান্ডা", "reason": "অ্যানিমিয়ায় শরীর গুরুত্বপূর্ণ অঙ্গে (হৃদপিণ্ড, মস্তিষ্ক) অক্সিজেন পাঠাতে হাত-পায়ের রক্তনালি সংকুচিত করে, ফলে হাত-পা ঠান্ডা থাকে।"},
    "headache": {"title": "মাথাব্যথা", "reason": "মস্তিষ্কে অক্সিজেন ও রক্ত প্রবাহ কমলে সেরিব্রাল ভাসোডাইলেশন হয় এবং মাথাব্যথা সৃষ্টি হয়।"},
    "palpitations": {"title": "হৃদস্পন্দন বেড়ে যাওয়া", "reason": "রক্তে হিমোগ্লোবিন কম থাকলে শরীরের অক্সিজেনের ঘাটতি পূরণ করতে হৃদপিণ্ডকে স্বাভাবিকের চেয়ে দ্রুত কাজ করতে হয়। ফলে হৃদস্পন্দন বেড়ে যাওয়ার অনুভূতি হতে পারে।"},
    "chest_pain": {"title": "বুকে ব্যথা", "reason": "গুরুতর অ্যানিমিয়ায় হৃদপেশিতে অক্সিজেন ঘাটতি হলে বুকে ব্যথা বা চাপ অনুভব হতে পারে — এটি জরুরি লক্ষণ।"},
    "difficulty_concentrating": {"title": "মনোযোগের সমস্যা", "reason": "মস্তিষ্কে পর্যাপ্ত অক্সিজেন না পৌঁছালে মনোযোগ ধরে রাখা, মনে রাখা এবং চিন্তা করার ক্ষমতা কিছুটা কমে যেতে পারে।"},
    "loss_of_appetite": {"title": "ক্ষুধামন্দা", "reason": "অ্যানিমিয়ায় পাচনতন্ত্রে রক্ত সরবরাহ কমে, যা ক্ষুধা হ্রাস করতে পারে।"},
    "craving_ice": {"title": "বরফ খাওয়ার ইচ্ছা (Pica)", "reason": "আয়রনের ঘাটতিতে মস্তিষ্কের ডোপামিন ব্যবস্থাপনা প্রভাবিত হয়, ফলে অস্বাভাবিক খাবারের প্রতি আকর্ষণ তৈরি হয়।"},
}

_SYMPTOM_EXPLANATIONS_EN = {
    "fatigue": {"title": "Fatigue", "reason": "Low hemoglobin reduces oxygen delivery to cells, decreasing ATP production in muscles and brain, causing excessive fatigue."},
    "weakness": {"title": "Weakness", "reason": "Oxygen deficiency reduces muscle function, making it difficult for the body to perform normal activities."},
    "dizziness": {"title": "Dizziness", "reason": "Reduced oxygen flow to the brain affects the vestibular system, causing imbalance and dizziness."},
    "shortness_of_breath": {"title": "Shortness of Breath", "reason": "The body increases breathing rate to compensate for oxygen deficiency, causing shortness of breath with minimal exertion."},
    "pale_skin": {"title": "Pale Skin, Nails or Eyelids", "reason": "When hemoglobin levels decrease, the skin, nails and inner eyelids appear paler than normal."},
    "cold_hands": {"title": "Cold Hands and Feet", "reason": "In anemia, the body constricts blood vessels in hands and feet to send oxygen to vital organs (heart, brain), resulting in cold extremities."},
    "headache": {"title": "Headache", "reason": "Reduced oxygen and blood flow to the brain causes cerebral vasodilation, leading to headaches."},
    "palpitations": {"title": "Heart Palpitations", "reason": "To compensate for oxygen deficiency from low hemoglobin, the heart must work faster than normal, causing palpitations."},
    "chest_pain": {"title": "Chest Pain", "reason": "In severe anemia, oxygen deficiency in heart muscles can cause chest pain or pressure — this is an emergency symptom."},
    "difficulty_concentrating": {"title": "Concentration Issues", "reason": "Inadequate oxygen supply to the brain can reduce the ability to focus, remember and think."},
    "loss_of_appetite": {"title": "Loss of Appetite", "reason": "Reduced blood supply to the digestive system in anemia can decrease appetite."},
    "craving_ice": {"title": "Craving Ice (Pica)", "reason": "Iron deficiency affects the brain's dopamine system, creating attraction to unusual foods."},
}

_DEFAULT_SYMPTOM_EXPLANATION_BN = {"title": "অন্যান্য লক্ষণ", "reason": "এই লক্ষণটি অ্যানিমিয়ার সাথে সম্পর্কিত হতে পারে। সঠিক কারণ নির্ণয়ের জন্য চিকিৎসকের পরামর্শ নিন।"}
_DEFAULT_SYMPTOM_EXPLANATION_EN = {"title": "Other Symptoms", "reason": "This symptom may be related to anemia. Consult a doctor for proper diagnosis."}

# WHO Hemoglobin Cutoffs (g/dL)
_WHO_THRESHOLDS = {
    "male": {"normal": 13.0, "mild": 11.0, "moderate": 8.0},
    "female": {"normal": 12.0, "mild": 11.0, "moderate": 8.0},
    "pregnant": {"normal": 11.0, "mild": 10.0, "moderate": 7.0},
    "child": {"normal": 11.5, "mild": 11.0, "moderate": 8.0},
}

_MCV_LABELS_BN = {
    "Microcytic": "MCV কম থাকায় লোহিত রক্তকণিকার আকার ছোট (মাইক্রোসাইটিক), যা সাধারণতঃ আয়রনের ঘাটতি নির্দেশ করে।",
    "Macrocytic": "MCV বেশি থাকায় লোহিত রক্তকণিকার আকার বড় (ম্যাক্রোসাইটিক), যা ভিটামিন বি১২ বা ফোলেটের ঘাটতি নির্দেশ করে।",
    "Normocytic": "MCV স্বাভাবিক সীমার মধ্যে রয়েছে, যা নরমোসাইটিক অ্যানিমিয়ার সাথে সামঞ্জস্যপূর্ণ।",
}

_MCV_LABELS_EN = {
    "Microcytic": "Low MCV indicates a microcytic pattern, typically associated with iron deficiency.",
    "Macrocytic": "High MCV indicates a macrocytic pattern, typically associated with B12 or folate deficiency.",
    "Normocytic": "MCV is within normal range, consistent with normocytic anemia.",
}

def _normalize_symptom(symptom_str: str) -> str:
    cleaned = symptom_str.lower().strip().replace(" ", "_")
    return _SYMPTOM_ALIASES.get(cleaned, cleaned)


def _get_thresholds(gender: str, is_pregnant: bool) -> dict:
    if is_pregnant and gender.lower() == "female":
        return _WHO_THRESHOLDS["pregnant"]
    g = gender.lower() if isinstance(gender, str) else "female"
    return _WHO_THRESHOLDS.get(g, _WHO_THRESHOLDS["female"])


def _build_why_result_bn(hb_val, mcv_val, gender, is_pregnant, ml_confidence, ml_is_anemic, symptom_count, anemia_type):
    reasons = []
    try:
        hb = float(hb_val)
        thresholds = _get_thresholds(gender, is_pregnant)
        
        if is_pregnant:
            if hb <= thresholds["moderate"]: # < 7.0
                hb_text = f"গর্ভাবস্থায় আপনার হিমোগ্লোবিনের মাত্রা {hb:.1f} g/dL, যা আশঙ্কাজনকভাবে কম। এটি গর্ভস্থ শিশু ও মায়ের স্বাস্থ্যের জন্য অতি-ঝুঁকিপূর্ণ।"
            elif hb < thresholds["normal"]: # < 11.0
                hb_text = f"গর্ভাবস্থায় আপনার হিমোগ্লোবিনের মাত্রা {hb:.1f} g/dL। আন্তর্জাতিক মানদণ্ড (WHO) অনুযায়ী গর্ভাবস্থায় Hb ১১.০ g/dL এর নিচে নামলে রক্তস্বল্পতা বলে গণ্য করা হয়।"
            else:
                hb_text = f"আপনার হিমোগ্লোবিনের মাত্রা {hb:.1f} g/dL, যা গর্ভাবস্থার জন্য স্বাভাবিক সীমার মধ্যে রয়েছে।"
        else:
            if hb <= thresholds["moderate"]:
                hb_text = f"আপনার হিমোগ্লোবিনের মাত্রা {hb:.1f} g/dL, যা স্বাভাবিকের তুলনায় অনেক কম।"
            elif hb < thresholds["mild"]:
                hb_text = f"আপনার হিমোগ্লোবিনের মাত্রা {hb:.1f} g/dL, যা স্বাভাবিকের তুলনায় কম।"
            elif hb < thresholds["normal"]:
                hb_text = f"আপনার হিমোগ্লোবিনের মাত্রা {hb:.1f} g/dL, যা স্বাভাবিক সীমার সামান্য নিচে রয়েছে।"
            else:
                hb_text = f"আপনার হিমোগ্লোবিনের মাত্রা {hb:.1f} g/dL, যা স্বাভাবিক সীমার মধ্যে রয়েছে।"
        reasons.append(hb_text)
    except:
        pass

    mcv_text = _MCV_LABELS_BN.get(anemia_type, "")
    if mcv_text:
        reasons.append(mcv_text)

    if symptom_count > 0:
        reasons.append(f"আপনার শরীরে {symptom_count}টি অ্যানিমিয়া-সংশ্লিষ্ট লক্ষণ চিহ্নিত করা হয়েছে।")
    else:
        reasons.append("আপনি বর্তমানে উল্লেখযোগ্য কোনো শারীরিক লক্ষণ প্রকাশ করেননি।")

    ml_text = f"AI মডেল {ml_confidence:.0f}% নিশ্চিততার সাথে আপনার অ্যানিমিয়ার সম্ভাবনা শনাক্ত করেছে।" if ml_is_anemic else f"AI মডেল {ml_confidence:.0f}% নিশ্চিততার সাথে স্বাভাবিক ফলাফল প্রদর্শন করছে।"
    reasons.append(ml_text)

    return " ".join(reasons)


def _build_why_result_en(hb_val, mcv_val, gender, is_pregnant, ml_confidence, ml_is_anemic, symptom_count, anemia_type):
    reasons = []
    try:
        hb = float(hb_val)
        thresholds = _get_thresholds(gender, is_pregnant)
        
        if is_pregnant:
            if hb <= thresholds["moderate"]:
                hb_text = f"During pregnancy, your hemoglobin level is {hb:.1f} g/dL, which is critically low and poses a severe risk to both mother and fetus."
            elif hb < thresholds["normal"]:
                hb_text = f"Your hemoglobin level is {hb:.1f} g/dL. Per WHO guidelines, Hb below 11.0 g/dL during pregnancy indicates maternal anemia."
            else:
                hb_text = f"Your hemoglobin level is {hb:.1f} g/dL, which is healthy and normal for pregnancy."
        else:
            if hb <= thresholds["moderate"]:
                hb_text = f"Your hemoglobin level is {hb:.1f} g/dL, which is significantly lower than normal."
            elif hb < thresholds["mild"]:
                hb_text = f"Your hemoglobin level is {hb:.1f} g/dL, which is lower than normal."
            elif hb < thresholds["normal"]:
                hb_text = f"Your hemoglobin level is {hb:.1f} g/dL, which is slightly below normal."
            else:
                hb_text = f"Your hemoglobin level is {hb:.1f} g/dL, which is within normal range."
        reasons.append(hb_text)
    except:
        pass

    mcv_text = _MCV_LABELS_EN.get(anemia_type, "")
    if mcv_text:
        reasons.append(mcv_text)

    symptom_text = f"You reported {symptom_count} anemia-related symptoms." if symptom_count > 0 else "You reported no significant symptoms currently."
    reasons.append(symptom_text)

    ml_text = f"ML model detected anemia with {ml_confidence:.0f}% confidence." if ml_is_anemic else f"ML model did not detect anemia with {ml_confidence:.0f}% confidence."
    reasons.append(ml_text)

    return " ".join(reasons)


def _build_symptoms_analysis(symptoms, is_bn=True):
    if not symptoms:
        return []
    analysis_list = []
    for sym in symptoms:
        normalized_key = _normalize_symptom(sym)
        if is_bn:
            explanation = _SYMPTOM_EXPLANATIONS_BN.get(normalized_key, _DEFAULT_SYMPTOM_EXPLANATION_BN)
        else:
            explanation = _SYMPTOM_EXPLANATIONS_EN.get(normalized_key, _DEFAULT_SYMPTOM_EXPLANATION_EN)
        analysis_list.append({
            "symptom": normalized_key,
            "title": explanation["title"],
            "reason": explanation["reason"]
        })
    return analysis_list


def _build_nutrition_guidance(anemia_type: str, is_pregnant: bool = False, is_bn: True = True) -> dict:
    clean_type = "General Anemia"
    if anemia_type:
        if "Microcytic" in anemia_type:
            clean_type = "Microcytic"
        elif "Macrocytic" in anemia_type:
            clean_type = "Macrocytic"
        elif "Normocytic" in anemia_type:
            clean_type = "Normocytic"

    if is_bn:
        if is_pregnant:
            title = f"🤰 গর্ভাবস্থায় {clean_type} অ্যানিমিয়ার জন্য বিশেষ গর্ভকালীন খাদ্য নির্দেশিকা"
            foods = [
                "সুসিদ্ধ মুরগির কলিজা ও লাল মাংস (পরিমিত ও সুসিদ্ধ)",
                "ছোট দেশি মাছ (যেমন: মলা, ঢেলা, কাঁচকি) ও ডিম",
                "কচু শাক, পালং শাক, লাল শাক ও ছোলার ডাল",
                "ভিটামিন-সি যুক্ত ফল (যেমন: আমলকী, পেয়ারা, লেবু) — আয়রন শোষণে সাহায্য করে",
                "ফোলেট সমৃদ্ধ সবুজ শাকসবজি ও মসুর ডাল"
            ]
            avoid = [
                "প্রধান খাবার খাওয়ার ১ ঘণ্টার মধ্যে চা অথবা কফি পান সম্পূর্ণ নিষেধ",
                "কাঁচা বা অর্ধসিদ্ধ মাংস, কাঁচা ডিম বা অপাস্তুরিত দুধ খাওয়া কঠোরভাবে নিষেধ",
                "চিকিৎসকের পরামর্শ ছাড়া যেকোনো আয়রন বা ক্যালসিয়াম ওষুধ গ্রহণ"
            ]
            tip = "গর্ভাবস্থায় খাদ্যাভ্যাসের পাশাপাশি চিকিৎসকের (Gynecologist) পরামর্শে আয়রন ও ফোলিক অ্যাসিড সম্পূরক (Supplement) গ্রহণ করা অপরিহার্য।"
        else:
            if clean_type == "Microcytic":
                title = "মাইক্রোসাইটিক অ্যানিমিয়ার জন্য আয়রন-সমৃদ্ধ খাদ্য পরিকল্পনা"
                foods = ["মুরগি ও গরুর কলিজা", "ছোট মাছ (মলা, ঢেলা, কাঁচকি)", "স্থানীয় শাকসবজি (লাল শাক, কচু শাক)", "ডাল ও লেগুমিনাস খাবার", "ভিটামিন-সি সমৃদ্ধ ফল (পেয়ারা, আমলকী, লেবু)", "খেজুর ও চিটাগুড়"]
                avoid = ["খাবারের সাথে বা পরপরই চা/কফি পান করা", "চিকিৎসকের পরামর্শ ছাড়া ক্যালসিয়াম সাপ্লিমেন্ট", "অতিরিক্ত প্রসেসড খাবার"]
                tip = "উদ্ভিজ্জ আয়রন যুক্ত খাবারের সাথে লেবু বা ভিটামিন C সমৃদ্ধ ফল খেলে আয়রন শোষণ বহুগুণ বাড়ে।"
            elif clean_type == "Macrocytic":
                title = "ম্যাক্রোসাইটিক অ্যানিমিয়ার জন্য ভিটামিন B12 ও ফোলেট-সমৃদ্ধ খাদ্য পরিকল্পনা"
                foods = ["ডিম ও দুগ্ধজাত খাবার", "দেশি মাছ (রুই, কাতলা, ইলিশ)", "মুরগি, গরুর মাংস ও কলিজা", "সবুজ শাকসবজি ও ডাল"]
                avoid = ["অতিরিক্ত তাপে রান্না করা শাকসবজি", "অ্যালকোহল ও ফাস্টফুড"]
                tip = "ভিটামিন B12 সাধারণত প্রাণিজ খাবারে পাওয়া যায়; নিরামিষভোজীদের ডাক্তারদের পরামর্শে সাপ্লিমেন্ট নিতে হবে।"
            elif clean_type == "Normocytic":
                title = "নরমোসাইটিক অ্যানিমিয়ার জন্য সুষম প্রোটিনযুক্ত খাদ্য পরিকল্পনা"
                foods = ["উচ্চমানের প্রাণিজ প্রোটিন", "নদী ও সামুদ্রিক মাছ", "ডাল, ছোলা ও বাদাম", "ভিটামিন C ও অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ দেশি ফল"]
                avoid = ["অপুষ্টিকর শুষ্ক খাবার ও প্রসেসড ময়দা", "অতিরিক্ত চা-কফি পানের অভ্যাস"]
                tip = "নরমোসাইটিক অ্যানিমিয়ার ক্ষেত্রে মূল কারণ জানার জন্য ডাক্তারের পরীক্ষা-নিরীক্ষা জরুরি।"
            else:
                title = "অ্যানিমিয়ার জন্য সাধারণ সুষম খাদ্য গাইডলাইন"
                foods = ["মাংস, কলিজা ও ডিম", "তাজা নদী ও পুকুরের মাছ", "মসুর ডাল ও ছোলা", "স্থানীয় তাজা শাকসবজি ও ফল"]
                avoid = ["খাবারের ১ ঘণ্টার মধ্যে চা-কফি পান", "কোমল পানীয় ও প্রসেসড ফুড"]
                tip = "প্রতিদিন সুষম খাবার ও পর্যাপ্ত নিরাপদ পানি পান নিশ্চিত করুন।"
    else:
        # ENGLISH VERSION
        if is_pregnant:
            title = f"🤰 Pregnancy Special Dietary Guidance for {clean_type} Anemia"
            foods = [
                "Well-cooked chicken liver and lean red meat",
                "Small indigenous fish (Mola, Dhela) and well-cooked eggs",
                "Taro leaves, Spinach, Red spinach, and Chickpeas",
                "Vitamin-C rich fruits (Guava, Amla, Lemon) to boost iron absorption",
                "Folate-rich green leafy vegetables and lentils"
            ]
            avoid = [
                "Avoid tea or coffee within 1 hour of meals (blocks iron absorption)",
                "Strictly avoid raw or undercooked meat, eggs, or unpasteurized dairy",
                "Taking iron or calcium pills without doctor's prescription"
            ]
            tip = "Diet alone is not enough during pregnancy; prescribed Iron and Folic Acid supplements from a Gynecologist are essential."
        else:
            if clean_type == "Microcytic":
                title = "Iron-Rich Diet Plan for Microcytic Anemia"
                foods = ["Chicken and beef liver", "Small fish (Mola, Dhela)", "Local leafy greens (Spinach, Taro leaves)", "Lentils and legumes", "Vitamin C rich fruits (Guava, Amla, Lemon)", "Dates"]
                avoid = ["Drinking tea/coffee right after meals", "Taking excess calcium supplements without advice", "Processed fast foods"]
                tip = "Always pair plant-based iron foods with Vitamin C (e.g. lemon) to maximize iron absorption."
            elif clean_type == "Macrocytic":
                title = "Vitamin B12 and Folate-Rich Diet Plan"
                foods = ["Eggs and dairy products", "Local fish (Rui, Katla, Ilish)", "Poultry and meat", "Green leafy vegetables and beans"]
                avoid = ["Overcooked vegetables", "Alcohol and fast food"]
                tip = "Vegetarians are at higher risk of B12 deficiency and should consider doctor-guided supplementation."
            elif clean_type == "Normocytic":
                title = "Balanced High-Protein Diet Plan"
                foods = ["High-quality animal protein", "Freshwater and marine fish", "Lentils and nuts", "Vitamin C and antioxidant fruits"]
                avoid = ["Junk foods and refined flour", "Excessive tea/coffee"]
                tip = "Normocytic pattern requires full clinical evaluation to pinpoint the underlying cause."
            else:
                title = "General Nutrition Guidelines for Anemia"
                foods = ["Meat, liver, and eggs", "Fresh fish", "Lentils and chickpeas", "Local fresh vegetables and fruits"]
                avoid = ["Tea/coffee within 1 hour of meals", "Carbonated beverages"]
                tip = "Maintain a well-balanced diet and drink adequate safe water daily."

    return {
        "title": title,
        "recommended_foods": foods,
        "foods_to_avoid": avoid,
        "tip": tip
    }


def _build_action_plan(risk_level: str, is_pregnant: bool = False, is_bn: bool = True) -> dict:
    if is_bn:
        if risk_level == "Severe":
            if is_pregnant:
                return {
                    "urgency": "🚨 আজকেই জরুরি ভিত্তিতে গাইনি ডাক্তার দেখান!",
                    "steps": [
                        "আজই কোনো হাসপাতাল বা স্ত্রীরোগ ও প্রসূতি বিশেষজ্ঞের (Gynecologist) সাথে যোগাযোগ করুন।",
                        "জরুরি রক্ত পরীক্ষা (CBC, Serum Ferritin) সম্পন্ন করুন।",
                        "চিকিৎসকের পরামর্শ ছাড়া একা যাতায়াত করবেন না।"
                    ],
                    "safety": "এটি একটি স্বয়ংক্রিয় স্ক্রিনিং রিপোর্ট। গর্ভাবস্থায় তীব্র অ্যানিমিয়া মা ও শিশু উভয়ের জন্যই ঝুঁকিপূর্ণ, দ্রুত চিকিৎসকের পরামর্শ নিন।"
                }
            else:
                return {
                    "urgency": "🚨 আজকেই ডাক্তার দেখান!",
                    "steps": [
                        "আজই নিবন্ধিত মেডিসিন বিশেষজ্ঞ বা হাসপাতালে যোগাযোগ করুন।",
                        "CBC ও সিরাম আয়রন পরীক্ষা করান।",
                        "চিকিৎসকের নির্দেশ ছাড়া নিজ থেকে কোনো সাপ্লিমেন্ট নেবেন না।"
                    ],
                    "safety": "এটি একটি স্বয়ংক্রিয় রিপোর্ট। চূড়ান্ত রোগ নির্ণয় ও চিকিৎসার জন্য চিকিৎসকের শরণাপন্ন হন।"
                }
        elif risk_level == "Moderate":
            if is_pregnant:
                return {
                    "urgency": "⚠️ ১ সপ্তাহের মধ্যে প্রসূতি বিশেষজ্ঞের (Gynecologist) পরামর্শ নিন",
                    "steps": [
                        "আগামী ৭ দিনের মধ্যে আপনার গাইনি ডাক্তার বা নিকটস্থ এএনসি (ANC) ক্লিনিকে দেখান।",
                        "চিকিৎসকের নির্দেশিত ডাবল-ডোজ আয়রন বা থেরাপি নিয়মিত গ্রহণ করুন।",
                        "দৈনিক খাবারের সাথে পুষ্টিকর আয়রনযুক্ত খাবার যুক্ত করুন।"
                    ],
                    "safety": "গর্ভাবস্থায় মাঝারি অ্যানিমিয়া অবহেলা করা যাবে না। নিয়মিত গর্ভকালীন পরীক্ষা (ANC) নিশ্চিত করুন।"
                }
            else:
                return {
                    "urgency": "⚠️ ১ সপ্তাহের মধ্যে চিকিৎসকের পরামর্শ নিন",
                    "steps": [
                        "আগামী ৭ দিনের মধ্যে নিবন্ধিত ডাক্তারের সাথে দেখা করুন।",
                        "প্রয়োজনীয় রক্ত পরীক্ষা করান।",
                        "প্রতিদিন খাদ্যাভ্যাস লগ করুন এবং অতিরিক্ত শারীরিক পরিশ্রম এড়িয়ে চলুন।"
                    ],
                    "safety": "এটি একটি স্বয়ংক্রিয় রিপোর্ট। ডাক্তারের পরামর্শ অনুযায়ী ব্যবস্থা নিন।"
                }
        elif risk_level == "Mild":
            urgency_text = "১ মাসের মধ্যে নিয়মিত গর্ভকালীন চেকআপ করান" if is_pregnant else "১ মাসের মধ্যে চিকিৎসকের পরামর্শ নিন"
            return {
                "urgency": urgency_text,
                "steps": [
                    "আয়রন ও ভিটামিন সমৃদ্ধ খাদ্যাভ্যাস বাড়ান।",
                    "আগামী ৩০ দিনের মধ্যে রুটিন চেকআপ করান।",
                    "লক্ষণ বা ক্লান্তি বাড়লে দ্রুত চিকিৎসকের সাথে কথা বলুন।"
                ],
                "safety": "স্বয়ংক্রিয় রিপোর্ট। লক্ষণ পরিবর্তন হলে চিকিৎসকের পরামর্শ নিন।"
            }
        else: # Normal
            return {
                "urgency": "🟢 স্বাভাবিক — স্বাস্থ্যকর জীবনযাপন ও গর্ভকালীন যত্ন চালিয়ে যান" if is_pregnant else "🟢 স্বাভাবিক — স্বাস্থ্যকর জীবনযাপন চালিয়ে যান",
                "steps": [
                    "নিয়মিত সুষম খাদ্যাভ্যাস বজায় রাখুন।",
                    "পর্যাপ্ত বিশ্রাম ও পুষ্টিকর খাবার গ্রহণ করুন।",
                    "রুটিন চেকআপ বা এএনসি ভিজিট বজায় রাখুন।"
                ],
                "safety": "স্বয়ংক্রিয় রিপোর্ট। যেকোনো শারীরিক অসুস্থতায় চিকিৎসকের পরামর্শ নিন।"
            }
    else:
        # ENGLISH ACTION PLANS
        if risk_level == "Severe":
            if is_pregnant:
                return {
                    "urgency": "🚨 See a Gynecologist / Visit Hospital Emergency Today!",
                    "steps": [
                        "Contact a registered Gynecologist or visit a hospital today.",
                        "Get urgent CBC and blood profile tests.",
                        "Do not travel alone or delay medical intervention."
                    ],
                    "safety": "Severe anemia during pregnancy poses critical risks to both mother and baby. Immediate clinical care is required."
                }
            else:
                return {
                    "urgency": "🚨 See a doctor today!",
                    "steps": [
                        "Contact a registered doctor or hospital immediately.",
                        "Get CBC and serum iron tests.",
                        "Do not take unprescribed high-dose supplements."
                    ],
                    "safety": "Automated report. Please consult a registered physician for diagnosis."
                }
        elif risk_level == "Moderate":
            return {
                "urgency": "⚠️ Consult a Gynecologist within 1 week" if is_pregnant else "⚠️ Consult a doctor within 1 week",
                "steps": [
                    "Schedule a visit with your physician within 7 days.",
                    "Get recommended blood tests done.",
                    "Follow prescription for Iron/Folic acid supplements faithfully."
                ],
                "safety": "Automated report. Regular ANC and doctor visits are strongly recommended."
            }
        elif risk_level == "Mild":
            return {
                "urgency": "Consult doctor during routine ANC visit within 1 month" if is_pregnant else "Consult a doctor within 1 month",
                "steps": [
                    "Improve daily intake of iron and vitamin C rich foods.",
                    "Keep logging daily symptoms.",
                    "Seek medical advice if symptoms escalate."
                ],
                "safety": "Automated report. Maintain healthy diet and routine medical checkups."
            }
        else:
            return {
                "urgency": "🟢 Normal — Continue routine prenatal care" if is_pregnant else "🟢 Normal — Continue healthy lifestyle",
                "steps": [
                    "Maintain a balanced nutrient-dense diet.",
                    "Ensure adequate rest and hydration.",
                    "Keep up with routine checkups."
                ],
                "safety": "Automated report. Consult a doctor for any health concerns."
            }


# ===========================================================================
# MAIN PUBLIC API
# ===========================================================================

def get_ai_advice(profile: dict, ml_result: dict, risk: dict, symptoms: list = None) -> dict:
    """
    Generates unified screening summary, food guidance, and recommendations
    based on ML diagnosis, CBC metrics, symptoms, and Pregnancy status.
    """
    if symptoms is None:
        symptoms = []

    hb_val = profile.get("hb", "N/A")
    mcv_val = profile.get("mcv", "N/A")
    gender = profile.get("gender", "female")
    is_pregnant = bool(profile.get("pregnant", False)) if gender.lower() == "female" else False

    risk_level = risk.get("level", "Normal")
    
    anemia_type_obj = risk.get("anemia_type")
    if anemia_type_obj and isinstance(anemia_type_obj, dict):
        anemia_type_en = anemia_type_obj.get("en", "General Anemia")
        anemia_type_bn = anemia_type_obj.get("bn", "সাধারণ অ্যানিমিয়া")
    else:
        anemia_type_en = "General Anemia"
        anemia_type_bn = "সাধারণ অ্যানিমিয়া"

    risk_level_bn = risk.get("risk_level", {}).get("bn", "স্বাভাবিক")
    ml_confidence = float(ml_result.get("confidence", 0)) if ml_result else 0.0
    ml_is_anemic = bool(ml_result.get("is_anemic", False)) if ml_result else False

    hero = {
        "anemia_type_bn": anemia_type_bn,
        "anemia_type_en": anemia_type_en,
        "confidence": round(ml_confidence, 1),
        "risk_level_bn": risk_level_bn,
        "risk_level_en": f"{risk_level} Risk",
        "hb": hb_val,
        "mcv": mcv_val,
        "is_pregnant": is_pregnant
    }

    why_result = {
        "bn": _build_why_result_bn(hb_val, mcv_val, gender, is_pregnant, ml_confidence, ml_is_anemic, len(symptoms), anemia_type_en),
        "en": _build_why_result_en(hb_val, mcv_val, gender, is_pregnant, ml_confidence, ml_is_anemic, len(symptoms), anemia_type_en),
    }

    symptoms_analysis = {
        "bn": _build_symptoms_analysis(symptoms, is_bn=True),
        "en": _build_symptoms_analysis(symptoms, is_bn=False),
    }

    nutrition_guidance = {
        "bn": _build_nutrition_guidance(anemia_type_en, is_pregnant=is_pregnant, is_bn=True),
        "en": _build_nutrition_guidance(anemia_type_en, is_pregnant=is_pregnant, is_bn=False),
    }

    action_plan = {
        "bn": _build_action_plan(risk_level, is_pregnant=is_pregnant, is_bn=True),
        "en": _build_action_plan(risk_level, is_pregnant=is_pregnant, is_bn=False),
    }

    return {
        "hero": hero,
        "why_result": why_result,
        "symptoms_analysis": symptoms_analysis,
        "nutrition_guidance": nutrition_guidance,
        "action_plan": action_plan,
    }