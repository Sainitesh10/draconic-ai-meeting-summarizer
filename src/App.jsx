import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Settings, Flame, Shield, Swords, LogOut, Loader2, ChevronRight, CheckSquare } from 'lucide-react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // Auth States
  const [email, setEmail] = useState(localStorage.getItem('user_email') || '');
  const [userName, setUserName] = useState(localStorage.getItem('user_name') || '');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || 'AIzaSyBz5oExfAJnYPFL7eTdUH3Kh5yVB3JAX-Y');
  
  // Onboarding States
  const [authStep, setAuthStep] = useState(email && userName ? 'dashboard' : 'email'); // email, otp, name, dashboard
  const [otpInput, setOtpInput] = useState('');
  
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  
  const recognitionRef = useRef(null);
  const shouldRecordRef = useRef(false);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access in your browser settings.');
          shouldRecordRef.current = false;
          setIsRecording(false);
        }
      };

      recognitionRef.current.onend = () => {
        if (shouldRecordRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            shouldRecordRef.current = false;
            setIsRecording(false);
          }
        } else {
          setIsRecording(false);
        }
      };
    } else {
      alert("Your browser does not support Speech Recognition. Please use Google Chrome or Microsoft Edge.");
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording || shouldRecordRef.current) {
      shouldRecordRef.current = false;
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      shouldRecordRef.current = true;
      if(!transcript) {
         setSummaryData(null);
      }
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Already started', e);
      }
    }
  };

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    localStorage.setItem('gemini_api_key', e.target.value);
  };

  const requestOTP = async () => {
    if (!email) return alert("Please enter your email");
    try {
      await fetch('http://localhost:8000/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      setAuthStep('otp');
    } catch (e) {
      alert("Error connecting to backend. Is Python running?");
    }
  };

  const verifyOTP = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpInput })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('user_email', email);
        if (data.name) {
          setUserName(data.name);
          localStorage.setItem('user_name', data.name);
          setAuthStep('dashboard');
        } else {
          setAuthStep('name');
        }
      } else {
        alert("Invalid OTP!");
      }
    } catch (e) {
      alert("Error verifying OTP");
    }
  };

  const saveName = async () => {
    if (!userName) return alert("Please enter your name");
    try {
      await fetch('http://localhost:8000/api/user/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: userName })
      });
      localStorage.setItem('user_name', userName);
      setAuthStep('dashboard');
    } catch (e) {
      alert("Error saving name");
    }
  };

  const generateSummary = async () => {
    if (!transcript) return;
    setIsProcessing(true);
    
    try {
      const res = await fetch('http://localhost:8000/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email, 
          transcript: transcript,
          api_key: apiKey
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      
      let cleanedContent = data.result;
      cleanedContent = cleanedContent.replace(/```json/gi, '');
      cleanedContent = cleanedContent.replace(/```/g, '');
      cleanedContent = cleanedContent.trim();
      setSummaryData(JSON.parse(cleanedContent));
    } catch (error) {
      console.error('Error generating notes:', error);
      alert('Error generating notes: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (authStep !== 'dashboard') {
    return (
      <div className="onboarding-container">
        <div className="dragon-panel onboarding-card flex flex-col gap-8">
          <div className="flex flex-col items-center gap-3 pb-2">
            <img 
              src="/logo.png?v=3" 
              alt="" 
              style={{ width: '240px', height: '240px', objectFit: 'contain' }} 
              className="drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" 
            />
            <h1 className="logo-text justify-center mt-2">DRACONIC AI</h1>
          </div>
          
          {authStep === 'email' && (
            <div className="flex flex-col gap-4 text-left">
              <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Access Email</label>
              <input 
                type="email" 
                placeholder="warrior@realm.com" 
                className="dragon-input w-full"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && requestOTP()}
              />
              <button className="btn-primary w-full mt-4" onClick={requestOTP}>
                Enter the Realm <ChevronRight size={18} />
              </button>
            </div>
          )}

          {authStep === 'otp' && (
            <div className="flex flex-col gap-4 text-left">
              <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Authentication Scroll</label>
              <p className="text-xs text-gray-400 mb-2">A 6-digit code has been forged and sent to <strong className="text-red-400">{email}</strong>.</p>
              <input 
                type="text" 
                placeholder="• • • • • •" 
                className="dragon-input w-full text-center tracking-[0.5em] text-xl font-bold"
                value={otpInput}
                maxLength={6}
                onChange={e => setOtpInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyOTP()}
              />
              <button className="btn-primary w-full mt-4" onClick={verifyOTP}>
                Verify Code
              </button>
            </div>
          )}

          {authStep === 'name' && (
            <div className="flex flex-col gap-4 text-left">
              <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Identify Thyself</label>
              <p className="text-xs text-gray-400 mb-2">What name shall the AI use to identify your assigned bounties and tasks?</p>
              <input 
                type="text" 
                placeholder="Your Name" 
                className="dragon-input w-full"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
              />
              <button className="btn-primary w-full mt-4" onClick={saveName}>
                Complete Setup
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <div className="logo-text flex items-center">
          <img 
            src="/logo.png?v=3" 
            alt="" 
            style={{ width: '96px', height: '96px', objectFit: 'contain' }} 
            className="mr-3" 
          />
          DRACONIC AI
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col text-right pr-4 border-r border-[#4a1515]">
            <span className="text-sm font-bold text-white uppercase tracking-wider">{userName}</span>
            <span className="text-xs text-red-300/60">{email}</span>
          </div>
          
          {showSettings && (
            <input 
              type="password" 
              className="dragon-input text-sm py-1.5 w-64" 
              placeholder="API Configuration Scroll..." 
              value={apiKey}
              onChange={handleApiKeyChange}
            />
          )}
          <button className="btn-icon" onClick={() => setShowSettings(!showSettings)} title="System Configuration">
            <Settings size={18} />
          </button>
          <button className="btn-icon hover:text-red-500 hover:bg-red-900/20" onClick={() => { localStorage.clear(); window.location.reload(); }} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        {/* Left Panel: Recording & Transcript */}
        <div className="dragon-panel flex flex-col h-full overflow-hidden p-6">
          <div className="panel-header">
            <h2 className="panel-title">
              <span className={`status-dot ${isRecording ? 'status-live' : 'status-idle'}`} />
              Live Transcript
            </h2>
            <button 
              onClick={toggleRecording}
              className={`btn-primary ${isRecording ? 'btn-danger' : ''}`}
            >
              {isRecording ? <><MicOff size={18} /> Cease Capture</> : <><Mic size={18} /> Ignite Capture</>}
            </button>
          </div>
          
          <div className="transcript-area mb-6">
            {transcript ? (
              <span>{transcript}</span>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-40 gap-4">
                <Mic size={40} className="text-red-500/50" />
                <p className="text-sm uppercase tracking-widest text-red-200/50">Capture dormant. Ready to ignite.</p>
              </div>
            )}
          </div>

          <button 
            onClick={generateSummary}
            disabled={!transcript || isRecording || isProcessing}
            className="btn-primary w-full py-4 text-lg"
          >
            {isProcessing ? (
              <><Loader2 className="animate-spin" size={22} /> Channeling Insights...</>
            ) : (
              <><Flame size={22} /> Extract AI Insights</>
            )}
          </button>
        </div>

        {/* Right Panel: AI Insights */}
        <div className="dragon-panel flex flex-col h-full overflow-y-auto p-6">
          {!summaryData ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
              <Shield size={48} className="text-red-500/50" />
              <p className="text-sm uppercase tracking-widest text-red-200/50">Insights will forge here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="panel-header mb-0 border-none">
                <h2 className="panel-title text-red-500 text-xl">Forged Intelligence</h2>
              </div>

              {/* Personal Tasks Highlight */}
              {summaryData.my_tasks && summaryData.my_tasks.length > 0 && (
                <div className="insight-card border-l-4 border-l-red-600 !bg-red-950/20">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Swords className="text-red-500" size={18} /> Bounties for {userName}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {summaryData.my_tasks.map((task, i) => (
                      <label key={i} className="task-item cursor-pointer">
                        <input type="checkbox" className="task-checkbox" />
                        <span className="text-gray-300 text-sm leading-relaxed font-medium">{task}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* General Summary */}
              <div className="insight-card">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Shield className="text-gray-500" size={18} /> Grand Summary
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {summaryData.summary}
                </p>
              </div>
              
              {/* Key Decisions */}
              {summaryData.decisions && summaryData.decisions.length > 0 && (
                <div className="insight-card">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <CheckSquare className="text-red-400" size={18} /> Key Decrees
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-400 text-sm">
                    {summaryData.decisions.map((dec, i) => <li key={i}>{dec}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
