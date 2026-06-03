import os
import sqlite3
import random
import smtplib
from email.message import EmailMessage
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

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
    # Generate real 6 digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Store OTP in DB (upsert)
    cursor = db.cursor()
    cursor.execute("INSERT OR REPLACE INTO otps (email, otp) VALUES (?, ?)", (data.email, otp))
    db.commit()
    
    gmail_address = os.getenv("GMAIL_ADDRESS")
    gmail_password = os.getenv("GMAIL_APP_PASSWORD")
    
    if not gmail_address or not gmail_password:
        return {"message": f"OTP generated (SMTP credentials missing in .env). Use {otp} for testing."}
        
    try:
        msg = EmailMessage()
        msg['Subject'] = "Your Draconic AI Access Scroll"
        msg['From'] = gmail_address
        msg['To'] = data.email
        
        # Epic Dark Theme HTML Email
        msg.set_content(f"""
        <html>
          <body style="background-color: #0a0a0a; color: #e5e5e5; font-family: sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #dc2626; letter-spacing: 2px;">DRACONIC AI</h1>
            <p style="margin-bottom: 30px;">An attempt to enter the realm was made using this email address.</p>
            <p>Your authentication scroll bears the following seal:</p>
            <div style="background-color: #1a0505; border: 2px solid #dc2626; color: #fff; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 10px; margin: 30px auto; max-width: 300px; border-radius: 8px;">
                {otp}
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 40px;">If you did not request this, the scroll will naturally disintegrate.</p>
          </body>
        </html>
        """, subtype='html')
        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(gmail_address, gmail_password)
            server.send_message(msg)
            
        return {"message": "OTP successfully sent to your email!"}
    except Exception as e:
        print(f"SMTP Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email. Check your .env app password.")

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
