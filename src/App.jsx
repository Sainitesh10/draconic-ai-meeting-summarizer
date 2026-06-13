import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Settings, Flame, Shield, Swords, LogOut, Loader2, ChevronRight, CheckSquare, Upload, Mail } from 'lucide-react';
import { analyzeMeeting } from './utils/gemini';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  
  // Auth States
  const [userName, setUserName] = useState(localStorage.getItem('user_name') || '');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  
  // Onboarding States
  const [authStep, setAuthStep] = useState(userName && apiKey ? 'dashboard' : 'name');
  
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
      console.warn("Speech Recognition not supported in this browser.");
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording || shouldRecordRef.current) {
      shouldRecordRef.current = false;
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setAudioFile(null); // Clear audio file if starting live recording
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setTranscript(''); // Clear transcript if using audio file
      setSummaryData(null);
    }
  };

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    localStorage.setItem('gemini_api_key', e.target.value);
  };

  const completeSetup = () => {
    if (!userName || !apiKey) return alert("Please enter both Name and Gemini API Key");
    localStorage.setItem('user_name', userName);
    localStorage.setItem('gemini_api_key', apiKey);
    setAuthStep('dashboard');
  };

  const generateSummary = async () => {
    if (!transcript && !audioFile) return;
    setIsProcessing(true);
    
    try {
      const data = await analyzeMeeting(apiKey, userName, transcript, audioFile);
      setSummaryData(data);
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
            <p className="text-gray-400 text-sm mt-2 text-center">Your elite AI Meeting Summarizer powered by Gemini 2.5 Flash.</p>
          </div>
          
          <div className="flex flex-col gap-4 text-left">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Identify Thyself</label>
              <input 
                type="text" 
                placeholder="Your Name (e.g. John Doe)" 
                className="dragon-input w-full"
                value={userName}
                onChange={e => setUserName(e.target.value)}
              />
            </div>
            
            <div className="space-y-1 mt-2">
              <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Gemini API Key</label>
              <input 
                type="password" 
                placeholder="AI_xxxxxxxxxxxx" 
                className="dragon-input w-full"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && completeSetup()}
              />
            </div>

            <button className="btn-primary w-full mt-4" onClick={completeSetup}>
              Enter the Realm <ChevronRight size={18} />
            </button>
          </div>
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
            <span className="text-xs text-red-300/60">Commander</span>
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
          <div className="panel-header flex justify-between items-center">
            <h2 className="panel-title flex-1">
              <span className={`status-dot ${isRecording ? 'status-live' : 'status-idle'}`} />
              Audio Input
            </h2>
          </div>
          
          <div className="flex gap-4 mb-4">
            <button 
              onClick={toggleRecording}
              className={`flex-1 btn-primary ${isRecording ? 'btn-danger' : ''}`}
            >
              {isRecording ? <><MicOff size={18} /> Cease Capture</> : <><Mic size={18} /> Live Record</>}
            </button>

            <label className="flex-1 btn-primary cursor-pointer text-center justify-center">
              <Upload size={18} /> Upload Audio
              <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          
          <div className="transcript-area mb-6 flex-1 overflow-y-auto">
            {audioFile ? (
              <div className="h-full flex flex-col items-center justify-center opacity-70 gap-4 text-center p-4">
                <Upload size={40} className="text-red-400" />
                <div>
                  <p className="font-bold text-lg text-red-100">{audioFile.name}</p>
                  <p className="text-sm text-red-300 mt-1">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI Extraction</p>
                </div>
              </div>
            ) : transcript ? (
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
            disabled={(!transcript && !audioFile) || isRecording || isProcessing}
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
              {summaryData.summary && (
                <div className="insight-card">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Shield className="text-gray-500" size={18} /> Grand Summary
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {summaryData.summary}
                  </p>
                </div>
              )}
              
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

              {/* Follow-up Email */}
              {summaryData.follow_up_email && (
                <div className="insight-card mt-2">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Mail className="text-blue-400" size={18} /> Follow-Up Dispatch
                  </h3>
                  <div className="bg-black/30 p-4 rounded-lg border border-gray-800">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-serif">
                      {summaryData.follow_up_email}
                    </p>
                  </div>
                  <button className="mt-3 text-xs text-red-400 hover:text-red-300 uppercase tracking-widest font-bold"
                          onClick={() => {
                            navigator.clipboard.writeText(summaryData.follow_up_email);
                            alert("Dispatch copied to clipboard!");
                          }}>
                    Copy Dispatch
                  </button>
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
