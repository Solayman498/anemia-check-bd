from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from services.predictor import predict_anemia
from services.risk_engine import calculate_risk
from services.ai_service import get_ai_advice
from services.tracker_engine import TrackerRuleEngine
from services.tracker_weekly_service import generate_weekly_summary
import json
from datetime import datetime, timedelta

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
    score: Optional[float] = 0.0
    logs: List[Dict[str, Any]] = []
    language: str = "bn"
    symptoms: Optional[Any] = None
    uid: Optional[str] = None
    current_date: Optional[str] = None
    current_score: Optional[float] = None
    last_log_date: Optional[str] = None
    last_log_score: Optional[float] = None


class WeeklySummaryRequest(BaseModel):
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
        current_symptoms = []
        symptom_intensities = {}

        if isinstance(request.symptoms, dict):
            for name, value in request.symptoms.items():
                if isinstance(value, (int, float)) and value > 0:
                    current_symptoms.append(name)
                    symptom_intensities[name] = value
        elif isinstance(request.symptoms, list):
            for s in request.symptoms:
                if isinstance(s, dict):
                    name = s.get("name")
                    intensity = s.get("intensity", 1)
                    if name and intensity > 0:
                        current_symptoms.append(name)
                        symptom_intensities[name] = intensity
                elif isinstance(s, str):
                    current_symptoms.append(s)
                    symptom_intensities[s] = 1

        if not current_symptoms and request.logs:
            latest = request.logs[0]
            if isinstance(latest, dict):
                for symptom, value in latest.get("symptoms", {}).items():
                    if isinstance(value, (int, float)) and value > 0:
                        current_symptoms.append(symptom)
                        symptom_intensities[symptom] = value

        calc_score = request.current_score if request.current_score is not None else float(request.score or 0.0)
        
        if current_symptoms and calc_score == 0.0:
            total_intensity = sum(symptom_intensities.values())
            calc_score = round(min(10.0, total_intensity * 0.5), 1)

        previous_score = request.last_log_score
        previous_symptom_count = 0

        if previous_score is None and request.logs and len(request.logs) >= 2:
            prev = request.logs[1]
            if isinstance(prev, dict):
                raw_prev_score = prev.get("score")
                if raw_prev_score is not None and isinstance(raw_prev_score, (int, float)):
                    previous_score = float(raw_prev_score)
                
                prev_symptoms = prev.get("symptoms", {})
                if isinstance(prev_symptoms, dict):
                    for v in prev_symptoms.values():
                        if isinstance(v, (int, float)) and v > 0:
                            previous_symptom_count += 1

        print(f"DEBUG -> REQ LANG: '{request.language}', CURRENT DATE: {request.current_date}, SCORE: {calc_score}, PREVIOUS DATE: {request.last_log_date}, PREVIOUS SCORE: {previous_score}")

        engine = TrackerRuleEngine()
        user_lang = request.language if request.language in ["bn", "en"] else "bn"

        result_bn = engine.analyze(
            symptom_score=calc_score,
            symptoms=current_symptoms,
            symptom_intensities=symptom_intensities,
            previous_score=previous_score,
            previous_symptom_count=previous_symptom_count,
            language="bn"
        )

        result_en = engine.analyze(
            symptom_score=calc_score,
            symptoms=current_symptoms,
            symptom_intensities=symptom_intensities,
            previous_score=previous_score,
            previous_symptom_count=previous_symptom_count,
            language="en"
        )

        active_res = result_bn if user_lang == "bn" else result_en

        return {
            "status_key": active_res["status"]["key"],
            "status_color": active_res["status"]["color"],
            "score": active_res["score"],
            "score_level": active_res["score_level"],
            "symptom_count": active_res["symptom_count"],
            "trend_key": active_res["trend"]["key"],
            "risk_key": active_res["risk"]["key"],
            "summary": active_res["summary"],
            "symptom_details": active_res["symptom_details"],
            "medical_reasons": active_res["reason_keys"],
            "advice": active_res["advice"],
            "last_log_date": request.last_log_date,
            "last_log_score": request.last_log_score,
            "bn": {
                "status_key": result_bn["status"]["key"],
                "status_color": result_bn["status"]["color"],
                "score": result_bn["score"],
                "score_level": result_bn["score_level"],
                "symptom_count": result_bn["symptom_count"],
                "trend_key": result_bn["trend"]["key"],
                "risk_key": result_bn["risk"]["key"],
                "summary": result_bn["summary"],
                "symptom_details": result_bn["symptom_details"],
                "medical_reasons": result_bn["reason_keys"],
                "advice": result_bn["advice"]
            },
            "en": {
                "status_key": result_en["status"]["key"],
                "status_color": result_en["status"]["color"],
                "score": result_en["score"],
                "score_level": result_en["score_level"],
                "symptom_count": result_en["symptom_count"],
                "trend_key": result_en["trend"]["key"],
                "risk_key": result_en["risk"]["key"],
                "summary": result_en["summary"],
                "symptom_details": result_en["symptom_details"],
                "medical_reasons": result_en["reason_keys"],
                "advice": result_en["advice"]
            }
        }
        
    except Exception as e:
        print(f"[Tracker Error] {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tracker-weekly-summary")
async def tracker_weekly_summary(request: WeeklySummaryRequest):
    try:
        logs = request.logs[-7:] if len(request.logs) >= 7 else request.logs
        result = generate_weekly_summary(logs, request.language)
        return result
        
    except Exception as e:
        print(f"[Weekly Summary Error] {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }