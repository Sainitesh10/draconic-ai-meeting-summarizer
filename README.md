<div align="center">
  <img src="public/logo.png" alt="Draconic AI Logo" width="150"/>
  <h1>Draconic AI Meeting Summarizer 🐉</h1>
  <p>An elite, AI-powered meeting assistant built to capture live transcripts and forge actionable intelligence.</p>
</div>

<br/>

## 🚀 Project Overview

Draconic AI is a powerful meeting summarization tool that listens to your conversations in real-time, transcribes the audio, and uses Google's Gemini AI to instantly extract key takeaways, decisions, and personal bounties (tasks) assigned to the user. Built with a stunning dark-fantasy UI, it makes meeting productivity feel like an RPG quest.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Python, FastAPI, SQLite
- **AI/ML:** Google Gemini API
- **Auth:** Custom OTP Email Authentication via SMTP

## ✨ Features

- 🎙️ **Live Audio Capture:** Real-time speech-to-text transcription right in the browser.
- 🧠 **Forged Intelligence:** Extracts Grand Summaries, Key Decrees (Decisions), and personal "Bounties" (Tasks).
- 🛡️ **Secure Authentication:** OTP-based email login to ensure your transcripts are safe.
- 🎨 **Draconic UI:** A highly customized, immersive dark theme with custom scrollbars and hover states.

## 📸 Screenshots

*(Add screenshots of the dashboard and login screen here)*

## ⚙️ Setup Instructions

### Prerequisites
- Node.js & npm
- Python 3.9+
- A Google Gemini API Key
- A Gmail App Password (for OTPs)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sainitesh10/draconic-ai-meeting-summarizer.git
   cd draconic-ai-meeting-summarizer
   ```

2. **Frontend Setup:**
   ```bash
   npm install
   npm run dev
   ```

3. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file in the `backend` directory based on the `.env.example`:
   ```env
   GMAIL_ADDRESS=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_app_password
   ```

5. **Run the Backend:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## 🌐 Live Demo

*(Link to live deployment goes here)*

---
*Built with passion by [Gudala Sai Nitesh](https://github.com/Sainitesh10)*
