from typing import List, Dict, Any

def generate_weekly_summary(logs: List[Dict[str, Any]], language: str = "bn") -> Dict[str, Any]:
    """
    Generate weekly summary from last 7 days of logs.
    Handles dictionary or list structured logs cleanly.
    """
    
    if not logs:
        return {
            "summary": "গত সপ্তাহে কোনো লগ পাওয়া যায়নি।" if language == "bn" else "No logs found for the last week.",
            "trend": "স্থিতিশীল" if language == "bn" else "Stable",
            "changes": {}
        }
    
    symptom_list = ["fatigue", "dizziness", "swelling", "breathless", "heartbeat", "headache", "pale_eyes", "concentration"]
    symptom_changes = {}
    
    # ─── 1. Helper to extract intensity ───
    def get_symptom_val(symptom_dict_or_list, symptom_key):
        if isinstance(symptom_dict_or_list, dict):
            val = symptom_dict_or_list.get(symptom_key, 0)
            return val if isinstance(val, (int, float)) else 0
        elif isinstance(symptom_dict_or_list, list):
            for item in symptom_dict_or_list:
                if isinstance(item, dict) and item.get("name") == symptom_key:
                    return item.get("intensity", 1)
                elif item == symptom_key:
                    return 1
        return 0

    # ─── 2. Calculate Symptom Changes ───
    for symptom in symptom_list:
        values = []
        for log in logs:
            if isinstance(log, dict):
                symptoms_data = log.get("symptoms", {})
                values.append(get_symptom_val(symptoms_data, symptom))
        
        # Only analyze if the symptom appeared at least once
        if any(v > 0 for v in values):
            if len(values) >= 2:
                mid = len(values) // 2
                first_half = values[:mid] if len(values) >= 4 else values[:1]
                second_half = values[mid:] if len(values) >= 4 else values[-1:]
                
                avg_first = sum(first_half) / len(first_half) if first_half else 0
                avg_second = sum(second_half) / len(second_half) if second_half else 0
                
                diff = avg_second - avg_first
                
                if diff > 0.3:
                    symptom_changes[symptom] = "worsened"
                elif diff < -0.3:
                    symptom_changes[symptom] = "improved"
                else:
                    symptom_changes[symptom] = "stable"
            else:
                symptom_changes[symptom] = "stable"

    # ─── 3. Overall Score Trend ───
    scores = []
    for log in logs:
        if isinstance(log, dict):
            score = log.get("score", 0)
            if isinstance(score, (int, float)):
                scores.append(score)
    
    if len(scores) >= 2:
        mid = len(scores) // 2
        first_half = scores[:mid] if len(scores) >= 4 else scores[:1]
        second_half = scores[mid:] if len(scores) >= 4 else scores[-1:]
        
        avg_first = sum(first_half) / len(first_half) if first_half else 0
        avg_second = sum(second_half) / len(second_half) if second_half else 0
        
        if avg_second < avg_first - 0.5:
            overall_trend = "Improving" if language == "en" else "উন্নতি হচ্ছে"
        elif avg_second > avg_first + 0.5:
            overall_trend = "Worsening" if language == "en" else "অবনতি হচ্ছে"
        else:
            overall_trend = "Stable" if language == "en" else "স্থিতিশীল"
    else:
        overall_trend = "Stable" if language == "en" else "স্থিতিশীল"

    # ─── 4. Symptom Labels ───
    symptom_labels = {
        "fatigue": "Fatigue" if language == "en" else "ক্লান্তি",
        "dizziness": "Dizziness" if language == "en" else "মাথা ঘোরা",
        "swelling": "Swelling" if language == "en" else "ফোলাভাব",
        "breathless": "Breathlessness" if language == "en" else "শ্বাসকষ্ট",
        "heartbeat": "Heart Palpitations" if language == "en" else "বুক ধড়ফড়",
        "headache": "Headache" if language == "en" else "মাথাব্যথা",
        "pale_eyes": "Pale Eyes" if language == "en" else "চোখ ফ্যাকাশে",
        "concentration": "Concentration Issues" if language == "en" else "মনোযোগ সমস্যা"
    }

    # ─── 5. Build Human-Readable Summary ───
    improved = [symptom_labels.get(s, s) for s, c in symptom_changes.items() if c == "improved"]
    worsened = [symptom_labels.get(s, s) for s, c in symptom_changes.items() if c == "worsened"]
    
    summary_parts = []
    
    if improved:
        text = f"{', '.join(improved)} {'improved' if language == 'en' else 'কমেছে (উন্নতি হয়েছে)'}"
        summary_parts.append(text)
        
    if worsened:
        text = f"{', '.join(worsened)} {'worsened' if language == 'en' else 'বেড়েছে (অবনতি হয়েছে)'}"
        summary_parts.append(text)

    if summary_parts:
        prefix = "Last week, your " if language == "en" else "গত সপ্তাহে আপনার "
        summary = prefix + " এবং ".join(summary_parts) if language == "bn" else prefix + " and ".join(summary_parts)
        summary += "." if language == "en" else "।"
    else:
        summary = (
            "Your health symptoms remained stable over the last week."
            if language == "en"
            else "গত সপ্তাহে আপনার লক্ষণগুলিতে কোনো বিশেষ পরিবর্তন দেখা যায়নি, অবস্থা স্থিতিশীল রয়েছে।"
        )

    return {
        "summary": summary,
        "trend": overall_trend,
        "changes": symptom_changes
    }