import pickle
import numpy as np
from pathlib import Path

MODEL_PATH = Path(__file__).parent.parent / "model"

with open(MODEL_PATH / "anemia_bd_model.pkl", "rb") as f:
    model = pickle.load(f)

def predict_anemia(lab_data: dict, profile: dict) -> dict:

    gender_encoded = 0 if profile["gender"] == "female" else 1

    features = np.array([[
        gender_encoded,
        float(profile["age"]),
        float(lab_data["hb"]),
        float(lab_data["rbc"]),
        float(lab_data["pcv"]),
        float(lab_data["mcv"]),
        float(lab_data["mch"]),
        float(lab_data["mchc"]),
    ]])

    prediction  = model.predict(features)[0]
    probability = model.predict_proba(features)[0]

    return {
        "is_anemic":   bool(prediction == 1),
        "confidence":  round(float(max(probability)) * 100, 1),
        "anemic_prob": round(float(probability[1]) * 100, 1),
        "normal_prob": round(float(probability[0]) * 100, 1),
    }