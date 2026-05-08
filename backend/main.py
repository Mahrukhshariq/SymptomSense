from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
from dotenv import load_dotenv
import os
import json

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="SymptomSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SymptomRequest(BaseModel):
    age: int
    gender: str
    symptoms: List[str]
    duration: str
    severity: str
    extra_info: Optional[str] = ""

class ChatRequest(BaseModel):
    message: str
    history: List[dict]
    symptom_context: str

@app.get("/health")
def health():
    return {"status": "SymptomSense API is running"}

@app.post("/analyze")
def analyze(data: SymptomRequest):
    symptoms_text = ", ".join(data.symptoms)
    if data.extra_info:
        symptoms_text += f". Additional info: {data.extra_info}"

    prompt = f"""You are a helpful medical information assistant. A patient has described their symptoms.

Patient info:
- Age: {data.age}
- Gender: {data.gender}
- Symptoms: {symptoms_text}
- Duration: {data.duration}
- Severity: {data.severity}

Provide three possible conditions (most likely to least likely) with explanations, a recommended action, and self-care tips.

Return ONLY valid JSON in this exact format, no markdown, no extra text:
{{
  "conditions": [
    {{"name": "condition name", "likelihood": "High", "explanation": "brief explanation"}},
    {{"name": "condition name", "likelihood": "Medium", "explanation": "brief explanation"}},
    {{"name": "condition name", "likelihood": "Low", "explanation": "brief explanation"}}
  ],
  "recommended_action": "See a doctor soon",
  "self_care_tips": ["tip 1", "tip 2", "tip 3"],
  "disclaimer": "This is not a medical diagnosis. Please consult a qualified healthcare professional."
}}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    result = json.loads(response.choices[0].message.content.strip())
    return result

@app.post("/chat")
def chat(data: ChatRequest):
    messages = [
        {
            "role": "system",
            "content": f"""You are SymptomSense, a helpful medical information assistant.
The user previously described these symptoms: {data.symptom_context}
Answer follow-up questions helpfully but always remind them to consult a real doctor.
Keep responses concise and clear."""
        }
    ]
    for msg in data.history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": data.message})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.5,
    )
    return {"response": response.choices[0].message.content}