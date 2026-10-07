import Link from "next/link";
import "./transcription.css";
import TranscriptionClient from "./TranscriptionClient";

export const metadata = {
  title: "AI Audio Transcription | BMNTech",
  description: "Convert speech into accurate text using AI.",
};

export default function TranscriptionPage() {
  return (
    <div className="bmn-transcription-container">
      <header className="bmn-header">
        <div className="bmn-header-content">
          <Link href="/" className="bmn-logo">BMNTech</Link>
          <nav>
            <Link href="/ai/transcription" className="bmn-nav-link active">AI Transcription</Link>
          </nav>
        </div>
      </header>

      <main className="bmn-main-content">
        <div className="bmn-hero-section">
          <h1 className="bmn-title">AI Audio Transcription</h1>
          <p className="bmn-subtitle">Convert speech into accurate text using AI.</p>
        </div>

        <TranscriptionClient />
      </main>

      <footer className="bmn-footer">
        <p>&copy; {new Date().getFullYear()} BMNTech. All rights reserved.</p>
      </footer>
    </div>
  );
}
