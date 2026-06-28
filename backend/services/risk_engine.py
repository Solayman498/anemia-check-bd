# services/risk_engine.py

def calculate_risk(hb: float, mcv: float, gender: str, pregnant: bool) -> dict:
    """
    Calculate WHO risk level and anemia type.
    Returns both Bangla and English values for multilingual UI.
    """

    hb = float(hb)

    # WHO Risk Level
    if gender == "female" and pregnant:
        if hb < 7.0:
            level = "Severe"
        elif hb < 10.0:
            level = "Moderate"
        elif hb < 11.0:
            level = "Mild"
        else:
            level = "Normal"

    elif gender == "female":
        if hb < 8.0:
            level = "Severe"
        elif hb < 11.0:
            level = "Moderate"
        elif hb < 12.0:
            level = "Mild"
        else:
            level = "Normal"

    else:
        if hb < 9.0:
            level = "Severe"
        elif hb < 11.0:
            level = "Moderate"
        elif hb < 13.0:
            level = "Mild"
        else:
            level = "Normal"

    # UI Colors
    color_map = {
        "Severe": "red",
        "Moderate": "orange",
        "Mild": "yellow",
        "Normal": "green"
    }

    # Risk Level
    level_map = {
        "Severe": {
            "bn": "মারাত্মক",
            "en": "Severe"
        },
        "Moderate": {
            "bn": "মাঝারি",
            "en": "Moderate"
        },
        "Mild": {
            "bn": "হালকা",
            "en": "Mild"
        },
        "Normal": {
            "bn": "স্বাভাবিক",
            "en": "Normal"
        }
    }

    # Doctor Recommendation
    doctor_map = {
        "Severe": {
            "bn": "🔴 আজকেই ডাক্তার দেখান!",
            "en": "🔴 Consult a doctor today!"
        },
        "Moderate": {
            "bn": "🟠 এক সপ্তাহের মধ্যে ডাক্তার দেখান",
            "en": "🟠 Consult a doctor within one week"
        },
        "Mild": {
            "bn": "🟡 এক মাসের মধ্যে ডাক্তার দেখান",
            "en": "🟡 Consult a doctor within one month"
        },
        "Normal": {
            "bn": "✅ বার্ষিক স্বাস্থ্য পরীক্ষা করুন",
            "en": "✅ Annual health check-up is recommended"
        }
    }

    # Anemia Type
    anemia_type = None
    anemia_type_bn = None

    if mcv is not None:
        mcv = float(mcv)

        if mcv < 80:
            anemia_type = "Microcytic Anemia"
            anemia_type_bn = "মাইক্রোসাইটিক রক্তশূন্যতা"

        elif mcv > 100:
            anemia_type = "Macrocytic Anemia"
            anemia_type_bn = "ম্যাক্রোসাইটিক রক্তশূন্যতা"

        else:
            anemia_type = "Normocytic Anemia"
            anemia_type_bn = "নরমোসাইটিক রক্তশূন্যতা"

    return {
        "level": level,                      
        "color": color_map[level],           

        # Multilingual Risk Level
        "risk_level": level_map[level],

        # Multilingual Doctor Advice
        "doctor": doctor_map[level],

        # Multilingual Anemia Type
        "anemia_type": None if level == "Normal" else {
            "bn": anemia_type_bn,
            "en": anemia_type
        }
    }
