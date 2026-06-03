import os
import sqlite3
import random
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

# Setup Database
DB_FILE = "app.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Users table: email -> name
    c.execute('''CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, name TEXT)''')
    # OTPs table: email -> otp string
    c.execute('''CREATE TABLE IF NOT EXISTS otps (email TEXT PRIMARY KEY, otp TEXT)''')
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect(DB_FILE)
    try:
        yield conn
    finally:
        conn.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

# Allow React app to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class RequestOtpModel(BaseModel):
    email: str

class VerifyOtpModel(BaseModel):
    email: str
    otp: str

class UpdateNameModel(BaseModel):
    email: str
    name: str

class SummarizeModel(BaseModel):
    email: str
    transcript: str
    api_key: str

@app.post("/api/auth/request-otp")
def request_otp(data: RequestOtpModel, db: sqlite3.Connection = Depends(get_db)):
    # Generate 6 digit OTP (Hardcoded to 123456 for testing prototype without email server)
    otp = "123456"
    
    # Store OTP in DB (upsert)
    cursor = db.cursor()
    cursor.execute("INSERT OR REPLACE INTO otps (email, otp) VALUES (?, ?)", (data.email, otp))
    db.commit()
    
    return {"message": "OTP sent to your email! (For testing, use 123456)"}

@app.post("/api/auth/verify-otp")
def verify_otp(data: VerifyOtpModel, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT otp FROM otps WHERE email = ?", (data.email,))
    row = cursor.fetchone()
    
    if not row or row[0] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    # Clear the OTP
    cursor.execute("DELETE FROM otps WHERE email = ?", (data.email,))
    
    # Check if user exists to return their name
    cursor.execute("SELECT name FROM users WHERE email = ?", (data.email,))
    user_row = cursor.fetchone()
    name = user_row[0] if user_row else None
    
    db.commit()
    
    return {"message": "Successfully logged in", "name": name}

@app.post("/api/user/name")
def update_name(data: UpdateNameModel, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("INSERT OR REPLACE INTO users (email, name) VALUES (?, ?)", (data.email, data.name))
    db.commit()
    return {"message": "Name updated successfully!"}

@app.post("/api/summarize")
def summarize_meeting(data: SummarizeModel, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT name FROM users WHERE email = ?", (data.email,))
    user_row = cursor.fetchone()
    
    # Default fallback name
    user_name = user_row[0] if user_row else "the user"
    
    try:
        genai.configure(api_key=data.api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        You are an elite AI Meeting Assistant. I will provide a meeting transcript.
        The user of this app is named {user_name}. Pay special attention to when other people address them.
        Analyze it and return a JSON object with the following structure exactly (no markdown formatting around the json):
        {{
          "important_quotes": ["exact sentence 1 from transcript", "exact sentence 2"],
          "my_tasks": ["task 1 assigned specifically to {user_name}", "task 2"],
          "summary": "Clear, concise paragraph summarizing the meeting.",
          "decisions": ["decision 1", "decision 2"],
          "email_draft": "Subject: ... \\n\\nHi team..."
        }}
        
        Transcript:
        {data.transcript}
        """
        
        response = model.generate_content(prompt)
        return {"result": response.text}
    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
