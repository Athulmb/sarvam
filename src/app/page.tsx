import Link from "next/link";

export default function Home() {
  return (
    <div style={{ padding: "4rem", fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh" }}>
      <main style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>Welcome to BMNTech</h1>
        <p style={{ fontSize: "1.2rem", color: "#94a3b8", marginBottom: "3rem" }}>
          Explore our new AI-powered features and tools.
        </p>
        
        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1fr" }}>
          <Link 
            href="/ai/transcription" 
            style={{ 
              display: "block", 
              padding: "2rem", 
              backgroundColor: "#1e293b", 
              borderRadius: "16px",
              textDecoration: "none",
              color: "inherit",
              border: "1px solid #334155"
            }}
          >
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#818cf8" }}>🎙 AI Audio Transcription &rarr;</h2>
            <p style={{ color: "#94a3b8" }}>Convert speech into accurate text using our new Whisper AI integration.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
