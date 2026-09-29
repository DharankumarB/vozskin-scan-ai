"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { useLocale } from "@/components/language-provider";

type ChatMessage = { id: number; role: "assistant" | "user"; text: string };
type RecognitionEventLike = Event & { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechWindow = Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };

const welcome = "I can explain how the screening workflow is intended to work, but a safe AI assistant is not connected in this build. I won’t invent a result or provide a medical interpretation.";
const medicationRefusal = "VozSkin Scan AI cannot prescribe or recommend medication. A qualified healthcare professional can assess your symptoms and determine appropriate treatment.";

export function AssistantChat() {
  const { locale } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 0, role: "assistant", text: welcome }]);
  const [value, setValue] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [notice, setNotice] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function speak(text: string) {
    if (!voiceEnabled) return;
    if (!("speechSynthesis" in window)) { setNotice("Text-to-speech is not supported by this browser."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    const voice = voices.find((candidate) => candidate.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.lang = locale === "ta" || locale === "ta-Latn" ? "ta-IN" : locale === "hi" ? "hi-IN" : locale === "te" ? "te-IN" : locale === "kn" ? "kn-IN" : locale === "ml" ? "ml-IN" : "en-US";
    window.speechSynthesis.speak(utterance);
  }

  function send() {
    const question = value.trim();
    if (!question) return;
    const medicationAsk = /\b(medicine|medication|drug|tablet|dosage|dose|prescribe|prescription)\b/i.test(question);
    const response = medicationAsk ? medicationRefusal : "The safe AI assistant is not connected in this environment, so I can’t interpret screening information or generate a medical answer. Your message has not been sent to an AI service. Please review any actual report with a qualified healthcare professional.";
    const nextMessages: ChatMessage[] = [
      ...messages,
      { id: Date.now(), role: "user", text: question },
      { id: Date.now() + 1, role: "assistant", text: response },
    ];
    setMessages(nextMessages);
    setValue("");
    setNotice("No AI service is connected. This is a fixed safety response, not an AI-generated answer.");
    speak(response);
  }

  function toggleListening() {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setNotice("Speech-to-text is not supported in this browser. You can type your question instead."); return; }
    const recognition = new Recognition();
    recognition.lang = locale === "ta" || locale === "ta-Latn" ? "ta-IN" : locale === "hi" ? "hi-IN" : locale === "te" ? "te-IN" : locale === "kn" ? "kn-IN" : locale === "ml" ? "ml-IN" : "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setValue((current) => `${current}${current ? " " : ""}${transcript}`);
    };
    recognition.onerror = () => { setNotice("Speech recognition stopped. Please check browser microphone permissions or type your question."); setListening(false); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); setListening(true); setNotice("Speech recognition is handled by your browser and may use its speech service."); }
    catch { setListening(false); setNotice("Microphone access could not be started. Check browser permissions or type your question."); }
  }

  return <div className="assistant-layout">
    <section aria-label="Assistant transcript" className="chat-card">
      <div className="chat-heading"><span className="assistant-avatar"><Bot size={17} /></span><div><strong>VozSkin guide</strong><span>Safe, fixed information · AI service not connected</span></div><span className="assistant-status">Unavailable</span></div>
      <div aria-live="polite" className="chat-transcript" ref={transcriptRef}>
        {messages.map((message) => <div className={`chat-message ${message.role}`} key={message.id}><span className="chat-message-avatar">{message.role === "assistant" ? <Bot size={13} /> : "You"}</span><div className="chat-bubble">{message.text}{message.role === "assistant" && <button aria-label="Read response aloud" className="speak-message" onClick={() => speak(message.text)} type="button"><Volume2 size={12} /></button>}</div></div>)}
      </div>
      {notice && <div className="chat-notice" role="status">{notice}</div>}
      <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); send(); }}><label className="sr-only" htmlFor="assistant-input">Type your question</label><input id="assistant-input" maxLength={800} onChange={(event) => setValue(event.target.value)} placeholder="Ask about the screening process…" value={value} /><button aria-label={listening ? "Stop voice input" : "Start voice input"} className={`icon-plain${listening ? " listening" : ""}`} onClick={toggleListening} type="button">{listening ? <MicOff size={15} /> : <Mic size={15} />}</button><button aria-label="Send question" className="button button-primary button-icon" disabled={!value.trim()} type="submit"><Send size={15} /></button></form>
    </section>
    <aside className="chat-side"><h3>Voice & safety</h3><p>Voice features use your browser’s speech capabilities. Browser support and available voices vary.</p><div className="voice-toggle-row"><span><Volume2 size={13} /> Read answers aloud</span><button aria-pressed={voiceEnabled} className={`switch-button${voiceEnabled ? " on" : ""}`} onClick={() => { setVoiceEnabled((enabled) => !enabled); if (voiceEnabled) window.speechSynthesis?.cancel(); }} type="button"><span /></button></div><label className="voice-control-label" htmlFor="voice-speed">Voice speed <span>{speed.toFixed(1)}×</span></label><input id="voice-speed" max="1.5" min="0.75" onChange={(event) => setSpeed(Number(event.target.value))} step="0.05" type="range" value={speed} />
      {voices.length > 0 && <div className="field voice-select-field"><label htmlFor="voice-select">Available browser voice</label><select id="voice-select" onChange={(event) => setSelectedVoice(event.target.value)} value={selectedVoice}><option value="">System default</option>{voices.map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} · {voice.lang}</option>)}</select></div>}
      <div className="assistant-disclaimer"><strong>Not a medical assistant</strong><p>It cannot diagnose, prescribe, provide dosage, or replace a clinician. There is no generative AI connection in this environment.</p></div><div className="assistant-disclaimer subtle"><strong>Privacy note</strong><p>Typed text stays in this browser session. Speech recognition may be processed by your browser’s speech provider. Avoid entering identifying information.</p></div><button className="button button-quiet button-small voice-stop" onClick={() => { setVoiceEnabled(false); window.speechSynthesis?.cancel(); }} type="button"><VolumeX size={13} /> Mute and stop</button>
    </aside>
  </div>;
}
