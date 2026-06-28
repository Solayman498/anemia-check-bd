from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from services.predictor import predict_anemia
from services.risk_engine import calculate_risk
from services.ai_service import get_ai_advice, get_tracker_ai_advice

app = FastAPI(title="AnemiaCheck BD API", description="AI-powered Anemia Detection System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalysisRequest(BaseModel):
    profile: dict
    lab_data: Optional[dict] = None
    symptoms: List[str] = []


class TrackerAdviceRequest(BaseModel):
    score: float
    logs: List[Dict[str, Any]]
    language: str = "bn"


@app.get("/")
def root():
    return {
        "status": "AnemiaCheck BD API is running!",
        "message": "Welcome to AnemiaCheck BD - AI-powered Anemia Screening System"
    }


@app.post("/analyze")
async def analyze(req: AnalysisRequest):
    try:
        lab_data = req.lab_data or {}
        symptoms = req.symptoms if req.symptoms is not None else []
        
        if "hct" in lab_data and "pcv" not in lab_data:
            lab_data["pcv"] = lab_data["hct"]
        
        ml_result = None
        if lab_data.get("hb"):
            ml_result = predict_anemia(lab_data, req.profile)
        else:
            ml_result = {"is_anemic": False, "confidence": 0}

        hb = float(lab_data["hb"]) if lab_data.get("hb") else None

        if hb:
            mcv = lab_data.get("mcv")
            
            risk = calculate_risk(
                hb=hb,
                mcv=float(mcv) if mcv else 85,
                gender=req.profile["gender"],
                pregnant=req.profile.get("pregnant", False),
            )
        else:
            risk = {
                "level": "Unknown",
                "bn": "অজানা",
                "color": "yellow",
                "doctor": "ডাক্তার দেখান",
                "anemia_type": "Unknown",
                "anemia_type_bn": "অজানা"
            }

        profile_with_lab = {
            **req.profile,
            "hb": hb,
            "mcv": lab_data.get("mcv"),
        }

        advice = get_ai_advice(
            profile=profile_with_lab,
            ml_result=ml_result,
            risk=risk,
            symptoms=symptoms,
        )

        return {
            "ml_result": ml_result,
            "risk": risk,
            "advice": advice,
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tracker-advice")
async def tracker_advice(request: TrackerAdviceRequest):
    try:

        recent_logs = request.logs[:7]

        trend_text = "স্থিতিশীল"

        if len(recent_logs) >= 2:

            previous = recent_logs[1].get("score", 0)
            current = recent_logs[0].get("score", 0)

            diff = current - previous

            if diff >= 0.5:
                trend_text = "অবনতি হচ্ছে"

            elif diff <= -0.5:
                trend_text = "উন্নতি হচ্ছে"

            else:
                trend_text = "স্থিতিশীল"

        advice = await get_tracker_ai_advice(
            symptom_score=request.score,
            trend=trend_text,
            recent_logs=recent_logs,
            language=request.language
        )

        return advice

    except Exception as e:

        print(f"[Tracker Advice Error] {e}")

        return {
            "status": "মনোযোগ দিন",
            "status_color": "yellow",
            "summary": "আপনার সাম্প্রতিক স্বাস্থ্য তথ্য বিশ্লেষণ করা যায়নি।",
            "advice": [
                "নিয়মিত লক্ষণ লগ করুন।",
                "নিজের শারীরিক অবস্থার পরিবর্তন পর্যবেক্ষণ করুন।",
                "অবস্থা খারাপ হলে নিবন্ধিত চিকিৎসকের পরামর্শ নিন।"
            ]
        }