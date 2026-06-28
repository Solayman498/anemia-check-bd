import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

export const analyzeAnemia = async (profile, labData, symptoms) => {
  const response = await API.post("/analyze", {
    profile:  profile,
    lab_data: labData,
    symptoms: symptoms,
  });
  return response.data;
};