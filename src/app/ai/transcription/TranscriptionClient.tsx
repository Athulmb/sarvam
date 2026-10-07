"use client";

import React, { useState, useRef, useEffect } from "react";

export default function TranscriptionClient() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("hi-IN");
  const [isUploading, setIsUploading] = useState(false);
  const [progressState, setProgressState] = useState("");
  const [transcript, setTranscript] = useState("");
  const [segments, setSegments] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("Copy Transcript");

  const [transcriptionId, setTranscriptionId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  
  const [recentTranscripts, setRecentTranscripts] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchRecent = async () => {
    setLoadingRecent(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/api/ai/transcriptions`);
      if (res.ok) {
        const data = await res.json();
        setRecentTranscripts(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch recent transcripts", err);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setError("");
    const validTypes = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "audio/webm", "audio/ogg"];
    // Also check extension as fallback
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const validExts = ['mp3', 'wav', 'm4a', 'mp4', 'webm', 'ogg'];
    
    if (!validTypes.includes(selectedFile.type) && !validExts.includes(ext || '')) {
      setError("Unsupported file format. Please upload MP3, WAV, M4A, WebM or OGG.");
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      setError("File is too large. Maximum size is 100MB.");
      return;
    }

    setFile(selectedFile);
    setTranscript("");
    setSegments([]);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setTranscript("");
    setSegments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setIsUploading(true);
    setError("");
    setProgressState("Uploading audio...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);

    try {
      // Create object URL for audio playback if not already there
      
      setProgressState("Transcribing with AI...");
      // For development, ensure the backend URL is correct or use proxy
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const response = await fetch(`${backendUrl}/api/ai/transcription`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Transcription failed. Please try again.");
      }

      setProgressState("Finalizing transcript...");
      const data = await response.json();
      
      setTranscript(data.text);
      setSegments(data.segments || []);
      setTranscriptionId(data.id || "");
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
      setProgressState("");
    }
  };

  const handleCopy = async () => {
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript);
      setCopyStatus("✓ Copied");
      setTimeout(() => setCopyStatus("Copy Transcript"), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  const handleSaveToDB = async () => {
    if (!transcriptionId) return;
    setSaveStatus("Saving...");
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/api/ai/transcription/${transcriptionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript, title, description })
      });
      if (res.ok) {
        setSaveStatus("✓ Saved successfully!");
        fetchRecent();
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus("Failed to save.");
      }
    } catch (err) {
      setSaveStatus("Error saving.");
    }
  };

  const handleDownloadTxt = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcript.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSrt = () => {
    if (!segments || segments.length === 0) {
      // Fallback if no segments
      const blob = new Blob(["1\n00:00:00,000 --> 00:00:10,000\n" + transcript], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transcript.srt";
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const formatTime = (seconds: number) => {
      const date = new Date(0);
      date.setSeconds(seconds);
      const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
      const iso = date.toISOString().substr(11, 8);
      return `${iso},${ms}`;
    };

    let srtContent = "";
    segments.forEach((seg, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(seg.start)} --> ${formatTime(seg.end)}\n`;
      srtContent += `${seg.text.trim()}\n\n`;
    });

    const blob = new Blob([srtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcript.srt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bmn-transcription-module">
      {error && <div className="bmn-error-banner">{error}</div>}
      
      {!transcript && (
        <div className="bmn-upload-card">
          <div 
            className="bmn-dropzone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])}
              accept="audio/*,.mp3,.wav,.m4a,.mp4,.webm,.ogg"
              style={{ display: 'none' }}
            />
            
            {!file ? (
              <div className="bmn-dropzone-content">
                <span className="bmn-icon-mic">🎙</span>
                <p className="bmn-drop-text">Drag & drop your audio here</p>
                <span className="bmn-or-text">or</span>
                <button className="bmn-btn-outline">Browse Files</button>
                <p className="bmn-file-types">MP3 • WAV • M4A • WebM • OGG</p>
              </div>
            ) : (
              <div className="bmn-file-selected" onClick={(e) => e.stopPropagation()}>
                <div className="bmn-file-info">
                  <span className="bmn-file-name">{file.name}</span>
                  <span className="bmn-file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <button className="bmn-btn-text bmn-text-danger" onClick={handleRemoveFile}>
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="bmn-controls">
            <div className="bmn-language-select" style={{ gridColumn: "1 / -1" }}>
              <label>Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={isUploading}>
                <option value="hi-IN">Hindi</option>
                <option value="en-IN">English (India)</option>
                <option value="ml-IN">Malayalam</option>
                <option value="ta-IN">Tamil</option>
                <option value="te-IN">Telugu</option>
                <option value="kn-IN">Kannada</option>
                <option value="mr-IN">Marathi</option>
                <option value="bn-IN">Bengali</option>
              </select>
            </div>

            <button 
              className={`bmn-btn-primary ${isUploading || !file ? 'disabled' : ''}`}
              onClick={handleTranscribe}
              disabled={isUploading || !file}
            >
              {isUploading ? (
                <span className="bmn-loading-state">
                  <span className="bmn-spinner"></span> {progressState}
                </span>
              ) : (
                "✨ Transcribe Audio"
              )}
            </button>
          </div>
        </div>
      )}

      {transcript && (
        <div className="bmn-result-card">
          <div className="bmn-result-header">
            <h3>Transcript</h3>
            <span className="bmn-badge">{language.toUpperCase()}</span>
          </div>
          
          {file && (
             <div className="bmn-audio-player-container">
                <audio 
                  ref={audioRef} 
                  controls 
                  src={URL.createObjectURL(file)} 
                  className="bmn-audio-player" 
                />
             </div>
          )}

          <textarea 
            className="bmn-transcript-editor" 
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />

          <div className="bmn-save-db-section" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Title (optional)" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="bmn-input"
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <input 
              type="text" 
              placeholder="Description (optional)" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="bmn-input"
              style={{ flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid #ccc', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <button className="bmn-btn-primary" onClick={handleSaveToDB}>
              Save to DB
            </button>
            {saveStatus && <span style={{ color: saveStatus.includes('✓') ? '#4caf50' : '#f44336' }}>{saveStatus}</span>}
          </div>

          <div className="bmn-result-actions" style={{ marginTop: '1rem' }}>
            <button className="bmn-btn-outline" onClick={handleCopy}>
              {copyStatus}
            </button>
            <button className="bmn-btn-outline" onClick={handleDownloadTxt}>
              Download TXT
            </button>
            <button className="bmn-btn-outline" onClick={handleDownloadSrt}>
              Download SRT
            </button>
            <button className="bmn-btn-text" onClick={handleRemoveFile}>
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Recent Transcripts Section */}
      <div className="bmn-recent-transcripts" style={{ marginTop: '3rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Recent Transcriptions</h3>
        {loadingRecent ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        ) : recentTranscripts.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No recent transcriptions found.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {recentTranscripts.map((t: any) => (
              <div 
                key={t._id} 
                onClick={() => setSelectedTranscript(t)}
                style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid #333', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#333')}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>{t.title || t.fileName}</h4>
                {t.description && <p style={{ fontSize: '0.85rem', color: '#aaa', margin: '0 0 0.5rem 0' }}>{t.description}</p>}
                <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 0.5rem 0' }}>Language: {t.language}</p>
                <div style={{ background: '#1a1a2e', padding: '0.5rem', borderRadius: '4px', maxHeight: '100px', overflowY: 'auto', fontSize: '0.9rem', color: '#ddd' }}>
                  {t.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transcript Modal */}
      {selectedTranscript && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem'
        }} onClick={() => setSelectedTranscript(null)}>
          <div style={{
            background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px',
            width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
            position: 'relative', border: '1px solid #333'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedTranscript(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              &times;
            </button>
            <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>{selectedTranscript.title || selectedTranscript.fileName}</h2>
            {selectedTranscript.description && <p style={{ color: 'var(--text-secondary)' }}>{selectedTranscript.description}</p>}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <span className="bmn-badge">{selectedTranscript.language}</span>
              <span style={{ color: '#888', fontSize: '0.9rem' }}>{new Date(selectedTranscript.createdAt).toLocaleString()}</span>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', whiteSpace: 'pre-wrap', color: '#ddd', lineHeight: '1.6' }}>
              {selectedTranscript.text}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="bmn-btn-outline" onClick={() => {
                const blob = new Blob([selectedTranscript.text], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selectedTranscript.title || selectedTranscript.fileName || "transcript"}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}>Download TXT</button>
              <button className="bmn-btn-outline" onClick={() => {
                let srtContent = "";
                if (selectedTranscript.segments && selectedTranscript.segments.length > 0) {
                  const formatTime = (seconds: number) => {
                    const date = new Date(0);
                    date.setSeconds(seconds);
                    const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
                    const iso = date.toISOString().substr(11, 8);
                    return `${iso},${ms}`;
                  };
                  selectedTranscript.segments.forEach((seg: any, index: number) => {
                    srtContent += `${index + 1}\n`;
                    srtContent += `${formatTime(seg.start)} --> ${formatTime(seg.end)}\n`;
                    srtContent += `${seg.text.trim()}\n\n`;
                  });
                } else {
                  srtContent = "1\n00:00:00,000 --> 00:00:10,000\n" + selectedTranscript.text;
                }
                const blob = new Blob([srtContent], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selectedTranscript.title || selectedTranscript.fileName || "transcript"}.srt`;
                a.click();
                URL.revokeObjectURL(url);
              }}>Download SRT</button>
              <button className="bmn-btn-outline" onClick={() => {
                navigator.clipboard.writeText(selectedTranscript.text);
                setCopyStatus("Copied!");
                setTimeout(() => setCopyStatus("Copy Transcript"), 2000);
              }}>Copy Text</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
