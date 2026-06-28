"""
ai_service.py — Deterministic Medical Rule Engine
--------------------------------------------------
Anemia diagnosis section: fully rule-based, zero LLM involvement.
Tracker section: Groq LLM retained (low-risk coaching only).

Architecture:
  - get_ai_advice()         → deterministic rule engine (no LLM) - Returns BOTH languages
  - get_tracker_ai_advice() → Groq LLM (tracker coaching, returns BOTH languages)
"""

from __future__ import annotations

import os
import json
import itertools
import re
from typing import Any

from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Groq client pool (used by tracker only)
# ---------------------------------------------------------------------------

_GROQ_KEYS = [k for k in [
    os.getenv("GROQ_API_KEY_1"),
    os.getenv("GROQ_API_KEY_2"),
    os.getenv("GROQ_API_KEY_3"),
] if k]

_key_cycle = itertools.cycle(_GROQ_KEYS) if _GROQ_KEYS else None


def _get_client() -> Groq:
    if _key_cycle is None:
        raise RuntimeError("No Groq API keys configured.")
    return Groq(api_key=next(_key_cycle))


def _clean_json_response(text: str) -> str | None:
    """Strip markdown fences and extract the first JSON object."""
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        return None
    json_str = text[start : end + 1]
    json_str = re.sub(r",\s*}", "}", json_str)
    json_str = re.sub(r",\s*]", "]", json_str)
    return json_str


# ===========================================================================
# SECTION 1 — DETERMINISTIC KNOWLEDGE BASES
# ===========================================================================

# ---------------------------------------------------------------------------
# 1a. Symptom key mapping dictionary for normalization
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# 1b. Structured Symptom dictionaries (BOTH Bengali and English)
# ---------------------------------------------------------------------------
_SYMPTOM_EXPLANATIONS_BN: dict[str, dict[str, str]] = {
    "fatigue": {
        "title": "ক্লান্তি",
        "reason": "রক্তে হিমোগ্লোবিন কম থাকলে কোষে অক্সিজেন সরবরাহ কমে যায়, ফলে পেশি ও মস্তিষ্কে শক্তি উৎপাদন (ATP) কমে এবং অতিরিক্ত ক্লান্তি অনুভব হয়।"
    },
    "weakness": {
        "title": "দুর্বলতা",
        "reason": "অক্সিজেন ঘাটতির কারণে পেশির কার্যক্ষমতা কমে যায়, শরীর স্বাভাবিক কাজকর্ম করতে পারে না।"
    },
    "dizziness": {
        "title": "মাথা ঘোরা",
        "reason": "মস্তিষ্কে অক্সিজেন প্রবাহ কমলে ভেস্টিবুলার সিস্টেম প্রভাবিত হয়, ফলে ভারসাম্যহীনতা ও মাথা ঘোরা দেখা দেয়।"
    },
    "shortness_of_breath": {
        "title": "শ্বাসকষ্ট",
        "reason": "শরীর অক্সিজেনের ঘাটতি পূরণ করতে শ্বাসের হার বাড়িয়ে দেয়, ফলে সামান্য পরিশ্রমেই শ্বাসকষ্ট অনুভূত হয়।"
    },
    "pale_skin": {
        "title": "ত্বক, নখ বা চোখের পাতা ফ্যাকাশে হওয়া",
        "reason": "রক্তে হিমোগ্লোবিনের মাত্রা কমে গেলে ত্বক, নখ এবং চোখের পাতার ভেতরের অংশ স্বাভাবিকের তুলনায় ফ্যাকাশে দেখাতে পারে।"
    },
    "cold_hands": {
        "title": "হাত-পা ঠান্ডা",
        "reason": "অ্যানিমিয়ায় শরীর গুরুত্বপূর্ণ অঙ্গে (হৃদপিণ্ড, মস্তিষ্ক) অক্সিজেন পাঠাতে হাত-পায়ের রক্তনালি সংকুচিত করে, ফলে হাত-পা ঠান্ডা থাকে।"
    },
    "headache": {
        "title": "মাথাব্যথা",
        "reason": "মস্তিষ্কে অক্সিজেন ও রক্ত প্রবাহ কমলে সেরিব্রাল ভাসোডাইলেশন হয় এবং মাথাব্যথা সৃষ্টি হয়।"
    },
    "palpitations": {
        "title": "হৃদস্পন্দন বেড়ে যাওয়া",
        "reason": "রক্তে হিমোগ্লোবিন কম থাকলে শরীরের অক্সিজেনের ঘাটতি পূরণ করতে হৃদপিণ্ডকে স্বাভাবিকের চেয়ে দ্রুত কাজ করতে হয়। ফলে হৃদস্পন্দন বেড়ে যাওয়া বা বুক ধড়ফড় করার অনুভূতি হতে পারে।"
    },
    "chest_pain": {
        "title": "বুকে ব্যথা",
        "reason": "গুরুতর অ্যানিমিয়ায় হৃদপেশিতে অক্সিজেন ঘাটতি হলে বুকে ব্যথা বা চাপ অনুভব হতে পারে — এটি জরুরি লক্ষণ।"
    },
    "difficulty_concentrating": {
        "title": "মনোযোগের সমস্যা",
        "reason": "মস্তিষ্কে পর্যাপ্ত অক্সিজেন না পৌঁছালে মনোযোগ ধরে রাখা, মনে রাখা এবং চিন্তা করার ক্ষমতা কিছুটা কমে যেতে পারে।"
    },
    "loss_of_appetite": {
        "title": "ক্ষুধামন্দা",
        "reason": "অ্যানিমিয়ায় পাচনতন্ত্রে রক্ত সরবরাহ কমে, যা ক্ষুধা হ্রাস করতে পারে।"
    },
    "craving_ice": {
        "title": "বরফ খাওয়ার ইচ্ছা (Pica)",
        "reason": "আয়রনের ঘাটতিতে মস্তিষ্কের ডোপামিন ব্যবস্থাপনা প্রভাবিত হয়, ফলে অস্বাভাবিক খাবারের প্রতি আকর্ষণ তৈরি হয়।"
    },
}

_SYMPTOM_EXPLANATIONS_EN: dict[str, dict[str, str]] = {
    "fatigue": {
        "title": "Fatigue",
        "reason": "Low hemoglobin reduces oxygen delivery to cells, decreasing ATP production in muscles and brain, causing excessive fatigue."
    },
    "weakness": {
        "title": "Weakness",
        "reason": "Oxygen deficiency reduces muscle function, making it difficult for the body to perform normal activities."
    },
    "dizziness": {
        "title": "Dizziness",
        "reason": "Reduced oxygen flow to the brain affects the vestibular system, causing imbalance and dizziness."
    },
    "shortness_of_breath": {
        "title": "Shortness of Breath",
        "reason": "The body increases breathing rate to compensate for oxygen deficiency, causing shortness of breath with minimal exertion."
    },
    "pale_skin": {
        "title": "Pale Skin, Nails or Eyelids",
        "reason": "When hemoglobin levels decrease, the skin, nails and inner eyelids appear paler than normal."
    },
    "cold_hands": {
        "title": "Cold Hands and Feet",
        "reason": "In anemia, the body constricts blood vessels in hands and feet to send oxygen to vital organs (heart, brain), resulting in cold extremities."
    },
    "headache": {
        "title": "Headache",
        "reason": "Reduced oxygen and blood flow to the brain causes cerebral vasodilation, leading to headaches."
    },
    "palpitations": {
        "title": "Heart Palpitations",
        "reason": "To compensate for oxygen deficiency from low hemoglobin, the heart must work faster than normal, causing palpitations."
    },
    "chest_pain": {
        "title": "Chest Pain",
        "reason": "In severe anemia, oxygen deficiency in heart muscles can cause chest pain or pressure — this is an emergency symptom."
    },
    "difficulty_concentrating": {
        "title": "Concentration Issues",
        "reason": "Inadequate oxygen supply to the brain can reduce the ability to focus, remember and think."
    },
    "loss_of_appetite": {
        "title": "Loss of Appetite",
        "reason": "Reduced blood supply to the digestive system in anemia can decrease appetite."
    },
    "craving_ice": {
        "title": "Craving Ice (Pica)",
        "reason": "Iron deficiency affects the brain's dopamine system, creating attraction to unusual foods."
    },
}

_DEFAULT_SYMPTOM_EXPLANATION_BN: dict[str, str] = {
    "title": "অন্যান্য লক্ষণ",
    "reason": "এই লক্ষণটি অ্যানিমিয়ার সাথে সম্পর্কিত হতে পারে। সঠিক কারণ নির্ণয়ের জন্য চিকিৎসকের পরামর্শ নিন।"
}

_DEFAULT_SYMPTOM_EXPLANATION_EN: dict[str, str] = {
    "title": "Other Symptoms",
    "reason": "This symptom may be related to anemia. Consult a doctor for proper diagnosis."
}

# ---------------------------------------------------------------------------
# 1c. Structured Nutrition databases (BOTH Bengali and English)
# ---------------------------------------------------------------------------
_NUTRITION_BN: dict[str, dict[str, Any]] = {
    "Microcytic": {
        "title": "মাইক্রোসাইটিক অ্যানিমিয়ার জন্য আয়রন-সমৃদ্ধ খাদ্য পরিকল্পনা",
        "recommended_foods": [
            "মুরগির কলিজা ও গরুর কলিজা (সহজে শোষণযোগ্য হিম-আয়রন এবং ভিটামিন B12 এর চমৎকার উৎস)",
            "ছোট মাছ যেমন মলা, ঢেলা এবং কাঁচকি মাছ",
            "স্থানীয় শাকসবজি যেমন লাল শাক, পালং শাক, কচু শাক এবং ডাটা শাক",
            "ডাল ও লেগুমিনাস জাতীয় খাবার যেমন মসুর ডাল, ছোলা এবং মাষকলাই ডাল",
            "ভিটামিন C সমৃদ্ধ ফল যেমন পেয়ারা, আমলকি, লেবু এবং কাগজি লেবু (যা আয়রন শোষণ বাড়াতে সাহায্য করে)",
            "খেঁজুর এবং চিটাগুড়"
        ],
        "foods_to_avoid": [
            "খাবারের সাথে বা খাবার গ্রহণের ঠিক পরপরই চা অথবা কফি পান করা (এতে থাকা ট্যানিন ও ক্যাফেইন আয়রন শোষণে বাধা দেয়)",
            "চিকিৎসকের পরামর্শ ছাড়া অতিরিক্ত ক্যালসিয়াম সাপ্লিমেন্ট একই সাথে গ্রহণ করা",
            "অতিরিক্ত প্রক্রিয়াজাত খাদ্য এবং কার্বোনেটেড ড্রিংকস"
        ],
        "tip": "উদ্ভিজ্জ আয়রনযুক্ত খাবারের কার্যকারিতা বাড়াতে সর্বদা খাবারের সাথে লেবু বা ভিটামিন C সমৃদ্ধ ফল যুক্ত করুন।"
    },
    "Macrocytic": {
        "title": "ম্যাক্রোসাইটিক অ্যানিমিয়ার জন্য ভিটামিন B12 ও ফোলেট-সমৃদ্ধ খাদ্য পরিকল্পনা",
        "recommended_foods": [
            "ডিম এবং দুগ্ধজাত খাবার যেমন তরল দুধ, দই এবং ছানা (B12 ও প্রোটিনের প্রধান উৎস)",
            "দেশি মাছ যেমন রুই, কাতলা, মৃগেল এবং ইলিশ",
            "মুরগি ও গরুর মাংস এবং কলিজা",
            "ফোলেট সমৃদ্ধ সবুজ শাকসবজি যেমন পালং শাক, ব্রোকলি এবং বাঁধাকপি",
            "মসুর ডাল, মুগ ডাল এবং শিমের বিচি"
        ],
        "foods_to_avoid": [
            "অতিরিক্ত সেদ্ধ বা অতিরিক্ত তাপে রান্না করা শাকসবজি (এতে ফোলেট বা ভিটামিন B9 নষ্ট হয়ে যায়)",
            "অ্যালকোহল জাতীয় পানীয় পরিহার (যা B12 ও ফোলেট শোষণে বাধা সৃষ্টি করে)",
            "ফাস্টফুড এবং অতিরিক্ত তেল-চর্বিযুক্ত খাবার"
        ],
        "tip": "নিরামিষভোজীদের ক্ষেত্রে ভিটামিন B12 এর ঘাটতি হওয়ার ঝুঁকি সবচেয়ে বেশি থাকে, তাই চিকিৎসকের পরামর্শে সাপ্লিমেন্ট বা ফোর্টিফাইড খাদ্য গ্রহণ করা উচিত।"
    },
    "Normocytic": {
        "title": "নরমোসাইটিক অ্যানিমিয়ার জন্য সুষম ও উচ্চ-প্রোটিন খাদ্য পরিকল্পনা",
        "recommended_foods": [
            "উচ্চমানের প্রাণিজ প্রোটিন যেমন ডিম, মুরগির মাংস এবং চর্বিহীন লাল মাংস",
            "নদী ও সামুদ্রিক মাছ (যা প্রোটিন ও প্রয়োজনীয় খনিজ উপাদান সরবরাহ করে)",
            "উদ্ভিজ্জ প্রোটিন ও মাইক্রোনিউট্রিয়েন্ট সমৃদ্ধ খাবার যেমন মসুর ডাল, ছোলা, চীনাবাদাম এবং কাঠবাদাম",
            "ফোলেট এবং আয়রন সমৃদ্ধ স্থানীয় সবুজ শাক ও রঙিন সবজি",
            "রোগ প্রতিরোধ ক্ষমতা বাড়াতে ভিটামিন C এবং অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ দেশি ফল যেমন পেয়ারা ও আমলকি"
        ],
        "foods_to_avoid": [
            "অপুষ্টিকর শুষ্ক খাবার এবং প্রক্রিয়াজাত ময়দা জাতীয় খাবার",
            "খাবারের পুষ্টিগুণ নষ্ট করে এমন অতিরিক্ত মসলাযুক্ত ও বাসি খাবার",
            "খাবারের পুষ্টি উপাদান শোষণে বাধা দেয় এমন অতিরিক্ত চা-কফি পানের অভ্যাস"
        ],
        "tip": "নরমোসাইটিক অ্যানিমিয়া সাধারণত দীর্ঘস্থায়ী কোনো অভ্যন্তরীণ রোগ বা রক্তকণিকা ভেঙে যাওয়ার কারণে হতে পারে, তাই শুধুমাত্র ডায়েটের উপর নির্ভর না করে মূল কারণ নির্ণয়ে চিকিৎসকের সুনির্দিষ্ট মূল্যায়ন অত্যন্ত জরুরি।"
    },
    "General Anemia": {
        "title": "অ্যানিমিয়ার জন্য সুষম সাধারণ পুষ্টি নির্দেশিকা",
        "recommended_foods": [
            "মুরগি বা গরুর কলিজা এবং লাল মাংস",
            "দেশি মুরগির ডিম এবং নিয়মিত দুধ গ্রহণ",
            "নদী ও পুকুরের তাজা মাছ",
            "নিয়মিত মসুর ডাল, ছোলা এবং সুষম প্রোটিন",
            "স্থানীয় পুষ্টিকর শাকসবজি যেমন পালং শাক, লাল শাক এবং মিষ্টি আলু",
            "ভিটামিন C সমৃদ্ধ টক জাতীয় ফল যেমন লেবু, পেয়ারা এবং আমলকি"
        ],
        "foods_to_avoid": [
            "প্রধান খাবার খাওয়ার ১ ঘণ্টার মধ্যে চা অথবা কফি পান করা",
            "অতিরিক্ত প্রক্রিয়াজাত খাবার, কোমল পানীয় এবং রাস্তার খোলা খাবার",
            "চিকিৎসকের পরামর্শ ব্যতীত নিজের ইচ্ছামতো আয়রন বা ক্যালসিয়াম বড়ি খাওয়া"
        ],
        "tip": "প্রতিদিন সুষম ও বৈচিত্র্যময় খাবার নিশ্চিত করার পাশাপাশি পর্যাপ্ত নিরাপদ পানি পান করুন।"
    }
}

_NUTRITION_EN: dict[str, dict[str, Any]] = {
    "Microcytic": {
        "title": "Iron-Rich Diet Plan for Microcytic Anemia",
        "recommended_foods": [
            "Chicken liver and beef liver (excellent source of easily absorbable heme-iron and Vitamin B12)",
            "Small fish such as Mola, Dhela, and Kachki fish",
            "Local leafy vegetables like Red spinach, Spinach, Taro leaves, and Stem amaranth",
            "Lentils and legumes such as Red lentils, Chickpeas, and Black gram",
            "Vitamin C rich fruits like Guava, Amla, Lemon, and Kagzi lemon (helps increase iron absorption)",
            "Dates and Jaggery"
        ],
        "foods_to_avoid": [
            "Drinking tea or coffee with or immediately after meals (tannin and caffeine interfere with iron absorption)",
            "Taking excess calcium supplements simultaneously without doctor's advice",
            "Excessive processed foods and carbonated drinks"
        ],
        "tip": "Always add lemon or Vitamin C rich fruits with meals to enhance the effectiveness of plant-based iron."
    },
    "Macrocytic": {
        "title": "Vitamin B12 and Folate-Rich Diet Plan for Macrocytic Anemia",
        "recommended_foods": [
            "Eggs and dairy products like milk, yogurt, and paneer (primary sources of B12 and protein)",
            "Local fish like Rui, Katla, Mrigel, and Ilish",
            "Chicken, beef, and liver",
            "Folate-rich green vegetables like Spinach, Broccoli, and Cabbage",
            "Red lentils, Mung beans, and Beans"
        ],
        "foods_to_avoid": [
            "Overcooked or over-boiled vegetables (destroys folate/Vitamin B9)",
            "Avoid alcoholic beverages (interferes with B12 and folate absorption)",
            "Fast food and excessive oily foods"
        ],
        "tip": "Vegetarians are at highest risk of Vitamin B12 deficiency, so supplements or fortified foods should be taken with doctor's advice."
    },
    "Normocytic": {
        "title": "Balanced High-Protein Diet Plan for Normocytic Anemia",
        "recommended_foods": [
            "High-quality animal protein like Eggs, Chicken, and Lean red meat",
            "River and marine fish (provides protein and essential minerals)",
            "Plant-based protein and micronutrient-rich foods like Red lentils, Chickpeas, Peanuts, and Almonds",
            "Folate and iron-rich local green leafy and colorful vegetables",
            "Vitamin C and antioxidant-rich local fruits like Guava and Amla to boost immunity"
        ],
        "foods_to_avoid": [
            "Malnourished dry foods and processed flour products",
            "Excessively spicy and stale foods that destroy nutritional value",
            "Excessive tea-coffee drinking habits that hinder nutrient absorption"
        ],
        "tip": "Normocytic anemia is usually caused by chronic internal disease or breakdown of blood cells. Therefore, a thorough medical evaluation is crucial rather than relying solely on diet."
    },
    "General Anemia": {
        "title": "Balanced General Nutrition Guidelines for Anemia",
        "recommended_foods": [
            "Chicken or beef liver and red meat",
            "Local chicken eggs and regular milk consumption",
            "Fresh river and pond fish",
            "Regular red lentils, chickpeas, and balanced protein",
            "Local nutritious vegetables like Spinach, Red spinach, and Sweet potato",
            "Vitamin C rich sour fruits like Lemon, Guava, and Amla"
        ],
        "foods_to_avoid": [
            "Drinking tea or coffee within 1 hour of main meals",
            "Excessive processed foods, soft drinks, and street food",
            "Taking iron or calcium supplements without doctor's prescription"
        ],
        "tip": "Ensure balanced and varied meals daily along with adequate safe water intake."
    }
}

# ---------------------------------------------------------------------------
# 1d. Action plans by risk level (BOTH Bengali and English)
# ---------------------------------------------------------------------------
_ACTION_PLANS_BN: dict[str, dict[str, Any]] = {
    "Severe": {
        "urgency": "আজকেই ডাক্তার দেখান!",  
        "steps": [
            "আজই একজন নিবন্ধিত চিকিৎসক বা হাসপাতালে যোগাযোগ করুন।",
            "CBC (Complete Blood Count) ও সিরাম আয়রন পরীক্ষা করান।",
            "চিকিৎসকের নির্দেশনা ছাড়া কোনো সাপ্লিমেন্ট গ্রহণ করবেন না।",
            "একা ভ্রমণ এড়িয়ে চলুন — শারীরিক দুর্বলতার কারণে ঝুঁকি বেশি।"
        ],
        "safety": "এটি একটি স্বয়ংক্রিয় স্ক্রিনিং রিপোর্ট। চূড়ান্ত রোগ নির্ণয় ও চিকিৎসার জন্য অবশ্যই নিবন্ধিত চিকিৎসকের পরামর্শ নিন।"
    },
    "Moderate": {
        "urgency": "১ সপ্তাহের মধ্যে চিকিৎসকের পরামর্শ নিন",
        "steps": [
            "আগামী ৭ দিনের মধ্যে একজন চিকিৎসকের সাথে দেখা করুন।",
            "CBC ও প্রয়োজনীয় রক্ত পরীক্ষা করান।",
            "প্রতিদিন খাদ্যাভ্যাস লগ করুন এবং পুষ্টিকর খাবার গ্রহণ নিশ্চিত করুন।",
            "অতিরিক্ত শারীরিক পরিশ্রম আপাতত এড়িয়ে চলুন।"
        ],
        "safety": "এটি একটি স্বয়ংক্রিয় স্ক্রিনিং রিপোর্ট। চূড়ান্ত রোগ নির্ণয় ও চিকিৎসার জন্য অবশ্যই নিবন্ধিত চিকিৎসকের পরামর্শ নিন।"
    },
    "Mild": {
        "urgency": "১ মাসের মধ্যে চিকিৎসকের পরামর্শ নিন",
        "steps": [
            "খাদ্যাভ্যাস উন্নত করুন — আয়রন ও ভিটামিন সমৃদ্ধ খাবার বাড়ান।",
            "আগামী ৩০ দিনের মধ্যে একজন চিকিৎসকের সাথে কথা বলুন।",
            "নিয়মিত হালকা ব্যায়াম (হাঁটা) চালিয়ে যান।",
            "লক্ষণ বাড়লে দ্রুত চিকিৎসকের কাছে যান।"
        ],
        "safety": "এটি একটি স্বয়ংক্রিয় স্ক্রিনিং রিপোর্ট। চূড়ান্ত রোগ নির্ণয় ও চিকিৎসার জন্য অবশ্যই নিবন্ধিত চিকিৎসকের পরামর্শ নিন।"
    },
    "Normal": {
        "urgency": "স্বাভাবিক — স্বাস্থ্যকর জীবনযাপন চালিয়ে যান",
        "steps": [
            "সুষম খাদ্যাভ্যাস বজায় রাখুন।",
            "নিয়মিত ব্যায়াম করুন।",
            "বার্ষিক স্বাস্থ্য পরীক্ষা করান।"
        ],
        "safety": "এটি একটি স্বয়ংক্রিয় স্ক্রিনিং রিপোর্ট। যেকোনো স্বাস্থ্য সমস্যায় নিবন্ধিত চিকিৎসকের পরামর্শ নিন।"
    }
}

_ACTION_PLANS_EN: dict[str, dict[str, Any]] = {
    "Severe": {
        "urgency": "See doctor today!", 
        "steps": [
            "Contact a registered doctor or hospital today.",
            "Get CBC (Complete Blood Count) and serum iron tests.",
            "Do not take any supplements without doctor's advice.",
            "Avoid traveling alone — physical weakness increases risk."
        ],
        "safety": "This is an automated screening report. Please consult a registered doctor for final diagnosis and treatment."
    },
    "Moderate": {
        "urgency": "Consult a doctor within 1 week",
        "steps": [
            "See a doctor within the next 7 days.",
            "Get CBC and necessary blood tests.",
            "Log your daily diet and ensure nutritious food intake.",
            "Avoid excessive physical exertion for now."
        ],
        "safety": "This is an automated screening report. Please consult a registered doctor for final diagnosis and treatment."
    },
    "Mild": {
        "urgency": "Consult a doctor within 1 month",
        "steps": [
            "Improve your diet — increase iron and vitamin-rich foods.",
            "Consult a doctor within the next 30 days.",
            "Continue regular light exercise (walking).",
            "See a doctor quickly if symptoms worsen."
        ],
        "safety": "This is an automated screening report. Please consult a registered doctor for final diagnosis and treatment."
    },
    "Normal": {
        "urgency": "Normal — Continue healthy lifestyle",
        "steps": [
            "Maintain a balanced diet.",
            "Exercise regularly.",
            "Get annual health checkups."
        ],
        "safety": "This is an automated screening report. Please consult a registered doctor for any health concerns."
    }
}

# ---------------------------------------------------------------------------
# 1e. WHO Hb thresholds (g/dL) for why_result generation
# ---------------------------------------------------------------------------
_WHO_THRESHOLDS: dict[str, dict[str, float]] = {
    "male": {"normal": 13.0, "mild": 11.0, "moderate": 8.0},
    "female": {"normal": 12.0, "mild": 11.0, "moderate": 8.0},
    "child": {"normal": 11.5, "mild": 11.0, "moderate": 8.0},
}

_MCV_LABELS_BN = {
    "Microcytic": "MCV কম থাকায় মাইক্রোসাইটিক প্যাটার্ন দেখা যাচ্ছে।",
    "Macrocytic": "MCV বেশি থাকায় ম্যাক্রোসাইটিক প্যাটার্ন দেখা যাচ্ছে।",
    "Normocytic": "MCV স্বাভাবিক সীমার মধ্যে রয়েছে, যা নরমোসাইটিক অ্যানিমিয়ার সাথে সামঞ্জস্যপূর্ণ।",
}

_MCV_LABELS_EN = {
    "Microcytic": "Low MCV indicates a microcytic pattern.",
    "Macrocytic": "High MCV indicates a macrocytic pattern.",
    "Normocytic": "MCV is within normal range, consistent with normocytic anemia.",
}


# ===========================================================================
# SECTION 2 — RULE ENGINE BUILDERS & HELPERS (BOTH LANGUAGES)
# ===========================================================================

def _normalize_symptom(symptom_str: str) -> str:
    """Normalize and map symptom aliases into the base knowledge keys."""
    cleaned = symptom_str.lower().strip().replace(" ", "_")
    return _SYMPTOM_ALIASES.get(cleaned, cleaned)


def _build_why_result_bn(
    hb_val: Any,
    mcv_val: Any,
    gender: str,
    ml_confidence: float,
    ml_is_anemic: bool,
    symptom_count: int,
    anemia_type: str,
) -> str:
    """Return Bengali explanation paragraph containing all evidence."""
    reasons: list[str] = []

    # 1. Hb threshold check
    try:
        hb = float(hb_val)
        g = gender.lower() if isinstance(gender, str) else "female"
        thresholds = _WHO_THRESHOLDS.get(g, _WHO_THRESHOLDS["female"])
        if hb <= thresholds["moderate"]:
            hb_text = (
                f"আপনার হিমোগ্লোবিনের মাত্রা {hb:.1f} g/dL, "
                "যা স্বাভাবিকের তুলনায় অনেক কম।"
            )
        elif hb < thresholds["mild"]:
            hb_text = (
                f"আপনার হিমোগ্লোবিনের মাত্রা {hb:.1f} g/dL, "
                "যা স্বাভাবিকের তুলনায় কম।"
            )
        elif hb < thresholds["normal"]:
            hb_text = (
                f"আপনার হিমোগ্লোবিনের মাত্রা {hb:.1f} g/dL, "
                "যা স্বাভাবিক সীমার সামান্য নিচে রয়েছে।"
            )
        else:
            hb_text = (
                f"আপনার হিমোগ্লোবিনের মাত্রা {hb:.1f} g/dL, "
                "যা স্বাভাবিক সীমার মধ্যে রয়েছে।"
            )
        reasons.append(hb_text)
    except (TypeError, ValueError):
        pass

    # 2. ML model result
    if ml_is_anemic:
        reasons.append(f"ML মডেল {ml_confidence:.0f}% নির্ভুলতায় অ্যানিমিয়া শনাক্ত করেছে।")
    else:
        reasons.append(f"ML মডেল {ml_confidence:.0f}% নির্ভুলতায় অ্যানিমিয়া নেতিবাচক বা শনাক্ত করেনি।")

    # 3. MCV classification
    mcv_label = _MCV_LABELS_BN.get(anemia_type)
    if mcv_label:
        reasons.append(mcv_label)
    else:
        try:
            mcv = float(mcv_val)
            reasons.append(f"MCV এর মাত্রা {mcv:.1f} fL রেকর্ড করা হয়েছে।")
        except (TypeError, ValueError):
            pass

    # 4. Symptom count
    if symptom_count > 0:
        reasons.append(f"আপনি {symptom_count}টি অ্যানিমিয়া-সংশ্লিষ্ট লক্ষণ জানিয়েছেন।")
    else:
        reasons.append("আপনি বর্তমানে উল্লেখযোগ্য কোনো লক্ষণ জানাননি।")

    # ML text
    ml_text = (
        f"AI মডেল {ml_confidence:.0f}% নির্ভুলতায় অ্যানিমিয়ার সম্ভাবনা শনাক্ত করেছে।"
        if ml_is_anemic
        else f"AI মডেল {ml_confidence:.0f}% নির্ভুলতায় অ্যানিমিয়ার সম্ভাবনা শনাক্ত করেনি।"
    )

    mcv_text = _MCV_LABELS_BN.get(anemia_type, "")

    return f"{hb_text} {mcv_text} {reasons[3] if len(reasons) > 3 else ''} {ml_text}"


def _build_why_result_en(
    hb_val: Any,
    mcv_val: Any,
    gender: str,
    ml_confidence: float,
    ml_is_anemic: bool,
    symptom_count: int,
    anemia_type: str,
) -> str:
    """Return English explanation paragraph containing all evidence."""
    reasons: list[str] = []

    # 1. Hb threshold check
    try:
        hb = float(hb_val)
        g = gender.lower() if isinstance(gender, str) else "female"
        thresholds = _WHO_THRESHOLDS.get(g, _WHO_THRESHOLDS["female"])
        if hb <= thresholds["moderate"]:
            hb_text = (
                f"Your hemoglobin level is {hb:.1f} g/dL, "
                "which is significantly lower than normal."
            )
        elif hb < thresholds["mild"]:
            hb_text = (
                f"Your hemoglobin level is {hb:.1f} g/dL, "
                "which is lower than normal."
            )
        elif hb < thresholds["normal"]:
            hb_text = (
                f"Your hemoglobin level is {hb:.1f} g/dL, "
                "which is slightly below the normal range."
            )
        else:
            hb_text = (
                f"Your hemoglobin level is {hb:.1f} g/dL, "
                "which is within the normal range."
            )
        reasons.append(hb_text)
    except (TypeError, ValueError):
        pass

    # 2. ML model result
    if ml_is_anemic:
        reasons.append(f"ML model detected anemia with {ml_confidence:.0f}% confidence.")
    else:
        reasons.append(f"ML model did not detect anemia with {ml_confidence:.0f}% confidence.")

    # 3. MCV classification
    mcv_label = _MCV_LABELS_EN.get(anemia_type)
    if mcv_label:
        reasons.append(mcv_label)
    else:
        try:
            mcv = float(mcv_val)
            reasons.append(f"MCV level recorded at {mcv:.1f} fL.")
        except (TypeError, ValueError):
            pass

    # 4. Symptom count
    if symptom_count > 0:
        reasons.append(f"You reported {symptom_count} anemia-related symptoms.")
    else:
        reasons.append("You reported no significant symptoms currently.")

    mcv_text = _MCV_LABELS_EN.get(anemia_type, "")
    symptom_text = f"You reported {symptom_count} anemia-related symptoms." if symptom_count > 0 else "You reported no significant symptoms currently."
    ml_text = f"ML model detected anemia with {ml_confidence:.0f}% confidence." if ml_is_anemic else f"ML model did not detect anemia with {ml_confidence:.0f}% confidence."

    return f"{hb_text} {mcv_text} {symptom_text} {ml_text}"


def _build_symptoms_analysis(symptoms: list[str], is_bn: bool = True) -> list[dict[str, str]]:
    """Return structured dictionary representations for each validated symptom."""
    if not symptoms:
        return []
    
    analysis_list: list[dict[str, str]] = []
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


def _build_nutrition_guidance(anemia_type: str, is_bn: bool = True) -> dict[str, Any]:
    """Return fully structured dictionary object matching frontend contract."""
    if is_bn:
        db = _NUTRITION_BN.get(anemia_type, _NUTRITION_BN["General Anemia"])
    else:
        db = _NUTRITION_EN.get(anemia_type, _NUTRITION_EN["General Anemia"])
    return {
        "title": db["title"],
        "recommended_foods": db["recommended_foods"],
        "foods_to_avoid": db["foods_to_avoid"],
        "tip": db["tip"]
    }


def _build_action_plan(risk_level: str, is_bn: bool = True) -> dict[str, Any]:
    """Return a fixed action plan dict mapping structure for the explicit risk level."""
    if is_bn:
        plan = _ACTION_PLANS_BN.get(risk_level, _ACTION_PLANS_BN["Normal"])
    else:
        plan = _ACTION_PLANS_EN.get(risk_level, _ACTION_PLANS_EN["Normal"])
    return {
        "urgency": plan["urgency"],
        "steps": plan["steps"],
        "safety": plan["safety"],
    }


def _get_risk_level_bn(risk_level: str) -> str:
    """Return Bengali risk level"""
    map_bn = {
        "Severe": "মারাত্মক ঝুঁকি",
        "Moderate": "মাঝারি ঝুঁকি",
        "Mild": "হালকা ঝুঁকি",
        "Normal": "স্বাভাবিক"
    }
    return map_bn.get(risk_level, risk_level)


def _get_anemia_type_bn(anemia_type: str) -> str:
    """Return Bengali anemia type"""
    map_bn = {
        "Microcytic Anemia": "মাইক্রোসাইটিক অ্যানিমিয়া",
        "Macrocytic Anemia": "ম্যাক্রোসাইটিক অ্যানিমিয়া",
        "Normocytic Anemia": "নরমোসাইটিক অ্যানিমিয়া",
        "General Anemia": "সাধারণ অ্যানিমিয়া"
    }
    return map_bn.get(anemia_type, anemia_type)


# ===========================================================================
# SECTION 3 — PUBLIC API (Returns BOTH languages)
# ===========================================================================

def get_ai_advice(
    profile: dict,
    ml_result: dict,
    risk: dict,  # ← New structure from calculate_risk()
    symptoms: list[str] | None = None,
) -> dict:
    """
    Deterministic anemia analysis engine.
    Returns BOTH Bengali and English versions.
    Frontend will pick based on language preference.
    """
    if symptoms is None:
        symptoms = []

    # --- Extract inputs ---
    hb_val = profile.get("hb", "N/A")
    mcv_val = profile.get("mcv", "N/A")
    gender = profile.get("gender", "female")
    
    # . Get values from new risk structure
    risk_level: str = risk.get("level", "Normal")
    
    # . Get anemia type from new structure
    anemia_type_en = risk.get("anemia_type", {}).get("en", "General Anemia")
    anemia_type_bn = risk.get("anemia_type", {}).get("bn", "সাধারণ অ্যানিমিয়া")
    
    # . Get risk level from new structure
    risk_level_bn = risk.get("risk_level", {}).get("bn", "স্বাভাবিক")
    risk_level_en = risk.get("risk_level", {}).get("en", "Normal")

    ml_confidence: float = float(ml_result.get("confidence", 0)) if ml_result else 0.0
    ml_is_anemic: bool = bool(ml_result.get("is_anemic", False)) if ml_result else False

    # --- Build BOTH language versions ---
    
    # 1. Hero Section
    hero = {
        "anemia_type_bn": anemia_type_bn,
        "anemia_type_en": anemia_type_en,
        "confidence": round(ml_confidence, 1),
        "risk_level_bn": risk_level_bn,
        "risk_level_en": f"{risk_level} Risk",
        "hb": hb_val,
        "mcv": mcv_val,
    }

    # 2. Why Result
    why_result = {
        "bn": _build_why_result_bn(
            hb_val=hb_val,
            mcv_val=mcv_val,
            gender=gender,
            ml_confidence=ml_confidence,
            ml_is_anemic=ml_is_anemic,
            symptom_count=len(symptoms),
            anemia_type=anemia_type_en,
        ),
        "en": _build_why_result_en(
            hb_val=hb_val,
            mcv_val=mcv_val,
            gender=gender,
            ml_confidence=ml_confidence,
            ml_is_anemic=ml_is_anemic,
            symptom_count=len(symptoms),
            anemia_type=anemia_type_en,
        ),
    }

    # 3. Symptoms Analysis
    symptoms_analysis = {
        "bn": _build_symptoms_analysis(symptoms, is_bn=True),
        "en": _build_symptoms_analysis(symptoms, is_bn=False),
    }

    # 4. Nutrition Guidance
    nutrition_guidance = {
        "bn": _build_nutrition_guidance(anemia_type_en, is_bn=True),
        "en": _build_nutrition_guidance(anemia_type_en, is_bn=False),
    }

    # 5. Action Plan
    action_plan = {
        "bn": _build_action_plan(risk_level, is_bn=True),
        "en": _build_action_plan(risk_level, is_bn=False),
    }

    return {
        "hero": hero,
        "why_result": why_result,
        "symptoms_analysis": symptoms_analysis,
        "nutrition_guidance": nutrition_guidance,
        "action_plan": action_plan,
    }


# ---------------------------------------------------------------------------
# Tracker function — Groq LLM retained (returns BOTH languages)
# ---------------------------------------------------------------------------

async def get_tracker_ai_advice(
    symptom_score: float,
    **kwargs: Any
) -> dict:
    """
    Generate AI health progress advice based on recent symptom logs.
    Non-diagnostic coaching only.
    Returns BOTH Bengali and English versions.
    """

    trend: str = kwargs.get("trend", "stable")
    recent_logs: list = kwargs.get("recent_logs", [])

    # Get latest symptoms
    current_symptoms = []

    if recent_logs:
        latest = recent_logs[0]

        if isinstance(latest, dict):
            for symptom, value in latest.get("symptoms", {}).items():
                if isinstance(value, (int, float)) and value > 0:
                    current_symptoms.append(symptom)

    # --- Build Bengali prompt ---
    prompt_bn = f"""
Role:
আপনি একজন অভিজ্ঞ Health Progress Coach.

শুধুমাত্র ব্যবহারকারীর সাম্প্রতিক লক্ষণ অগ্রগতি বিশ্লেষণ করুন।

বর্তমান লক্ষণ স্কোর:
{symptom_score}/১০

সাম্প্রতিক প্রবণতা:
{trend}

বর্তমান লক্ষণ:
{", ".join(current_symptoms) if current_symptoms else "কোনো লক্ষণ নেই"}

নির্দেশনা:

• রোগ নির্ণয় করবেন না।

• ডায়েট, পুষ্টি, সাপ্লিমেন্ট, ওষুধ, ল্যাব টেস্ট বা চিকিৎসা পরিকল্পনা নিয়ে আলোচনা করবেন না।

• শুধুমাত্র বিশ্লেষণ করুন যে ব্যবহারকারীর অবস্থা উন্নতি করছে, খারাপ হচ্ছে বা স্থিতিশীল রয়েছে।

• বর্তমান শারীরিক অবস্থা সহজ বাংলায় ব্যাখ্যা করুন।

• শুধুমাত্র লক্ষণ অগ্রগতির উপর ভিত্তি করে ঠিক ৩টি ব্যবহারিক স্ব-যত্ন পরামর্শ দিন।

• যদি লক্ষণগুলি গুরুতর বলে মনে হয় বা খারাপ হচ্ছে, তাহলে একজন নিবন্ধিত চিকিৎসকের সাথে পরামর্শ করার পরামর্শ দিন।

শুধুমাত্র বৈধ JSON রিটার্ন করুন।

{{
    "status":"ভালো/মনোযোগ দিন/সতর্কতা",
    "status_color":"green/yellow/red",
    "summary":"২-৩ লাইনের বাংলা বিশ্লেষণ",
    "advice":[
        "পরামর্শ ১",
        "পরামর্শ ২",
        "পরামর্শ ৩"
    ]
}}
"""

    # --- Build English prompt ---
    prompt_en = f"""
Role:
You are an experienced Health Progress Coach.

Analyze only the user's recent symptom progression.

Current Symptom Score:
{symptom_score}/10

Recent Trend:
{trend}

Current Symptoms:
{", ".join(current_symptoms) if current_symptoms else "None"}

Instructions:

• Do NOT diagnose diseases.

• Do NOT mention diet, nutrition, supplements, medicines, laboratory tests or treatment plans.

• Analyze only whether the user's condition is improving, worsening or stable.

• Explain the current health condition in simple English.

• Give exactly 3 practical self-care recommendations based only on symptom progression.

• If symptoms appear severe or are worsening, recommend consulting a registered physician.

Return ONLY valid JSON.

{{
    "status":"Good/Need Attention/Warning",
    "status_color":"green/yellow/red",
    "summary":"2-3 line English analysis",
    "advice":[
        "Advice 1",
        "Advice 2",
        "Advice 3"
    ]
}}
"""

    try:
        client = _get_client()

        # Get Bengali response
        response_bn = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt_bn}],
            temperature=0.4,
            max_tokens=450,
        )
        json_data_bn = _clean_json_response(response_bn.choices[0].message.content)
        
        # Get English response
        response_en = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt_en}],
            temperature=0.4,
            max_tokens=450,
        )
        json_data_en = _clean_json_response(response_en.choices[0].message.content)

        if json_data_bn and json_data_en:
            data_bn = json.loads(json_data_bn)
            data_en = json.loads(json_data_en)
            
            return {
                "bn": data_bn,
                "en": data_en
            }

        raise ValueError("No valid JSON.")

    except Exception as exc:
        print(f"[Tracker LLM fallback] {exc}")

        # Fallback - BOTH languages
        if symptom_score <= 3:
            status_bn = "ভালো"
            status_en = "Good"
            color = "green"
        elif symptom_score <= 6:
            status_bn = "মনোযোগ দিন"
            status_en = "Need Attention"
            color = "yellow"
        else:
            status_bn = "সতর্কতা"
            status_en = "Warning"
            color = "red"

        return {
            "bn": {
                "status": status_bn,
                "status_color": color,
                "summary": f"বর্তমান লক্ষণ স্কোর {symptom_score}/১০। সাম্প্রতিক লক্ষণ অনুযায়ী নিজের শারীরিক অবস্থার পরিবর্তন পর্যবেক্ষণ করুন।",
                "advice": [
                    "প্রতিদিন আপনার লক্ষণ নিয়মিত লগ করুন।",
                    "লক্ষণ বৃদ্ধি পেলে বিশ্রাম নিন এবং পর্যাপ্ত পানি পান করুন।",
                    "অবস্থা খারাপ হলে বা নতুন লক্ষণ দেখা দিলে নিবন্ধিত চিকিৎসকের পরামর্শ নিন।"
                ]
            },
            "en": {
                "status": status_en,
                "status_color": color,
                "summary": f"Current symptom score is {symptom_score}/10. Monitor your physical condition based on recent symptoms.",
                "advice": [
                    "Log your symptoms regularly every day.",
                    "If symptoms increase, take rest and drink adequate water.",
                    "If condition worsens or new symptoms appear, consult a registered physician."
                ]
            }
        }