<div align="center">
  <img src="public/logo.png" alt="Draconic AI Logo" width="150"/>
  <h1>Draconic AI Meeting Summarizer 🐉</h1>
  <p>An elite, Serverless AI-powered meeting assistant built to capture live transcripts and forge actionable intelligence.</p>
</div>

<br/>

## 🚀 Project Overview

**Draconic AI** is a powerful meeting summarization tool that listens to your conversations in real-time or processes uploaded audio recordings (`.mp3`, `.wav`), and uses Google's **Gemini 2.5 Flash AI** to instantly extract key takeaways, decisions, and personal bounties (tasks) assigned to the user. Built with a stunning dark-fantasy UI, it makes meeting productivity feel like an RPG quest.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
- **AI Engine:** `@google/generative-ai` (Gemini 2.5 Flash)
- **Architecture:** 100% Serverless (All AI logic executed directly from the frontend)

## ✨ Features

- 🎙️ **Live Audio Capture:** Real-time speech-to-text transcription right in the browser.
- 📤 **Audio File Upload:** Upload raw meeting recordings (`.mp3`) and let Gemini 2.5 Flash natively transcribe and summarize them!
- 🧠 **Forged Intelligence:** Extracts Grand Summaries, Key Decrees (Decisions), and personal "Bounties" (Tasks).
- 📧 **Follow-Up Dispatch:** Automatically drafts a highly professional follow-up email covering all next steps, ready to be sent to your team.
- 🎨 **Draconic UI:** A highly customized, immersive dark theme with custom scrollbars and hover states.

## ⚙️ Setup Instructions

### Prerequisites
- Node.js & npm
- A Google Gemini API Key

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

3. **Configure the App:**
   Open the app at `http://localhost:5173`. You will be prompted to enter your Name and your Gemini API Key directly into the secure local storage. No backend needed!

## 🌐 Live Demo

*(Link to live deployment goes here)*

---
*Built with passion by [Gudala Sai Nitesh](https://github.com/Sainitesh10)*
