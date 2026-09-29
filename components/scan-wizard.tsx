"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, FileImage, ImagePlus, Info, LockKeyhole, RotateCcw, ShieldCheck, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useLocale } from "@/components/language-provider";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { inspectImageFile, type ImageInspection } from "@/lib/validation/image";
import { SymptomAnswersSchema, type SymptomAnswers } from "@/lib/screening/schema";

const stages = ["Consent", "Image", "Symptoms", "Review"];
const symptomLabels = [
  ["redness", "Redness"], ["scaling", "Scaling or flaking"], ["itching", "Itching"], ["dryness", "Dryness"],
  ["pain", "Pain"], ["burning", "Burning"], ["swelling", "Swelling"], ["recurrence", "Has this area had similar changes before?"],
] as const;
type YesNo = "yes" | "no" | "";
type HistoryChoice = "yes" | "no" | "unsure" | "";
type FormValues = {
  ageRange: string;
  location: string;
  durationDays: string;
  symptoms: Record<(typeof symptomLabels)[number][0], YesNo>;
  previousEpisodes: HistoryChoice;
  familyHistory: HistoryChoice;
  previousDiagnosis: HistoryChoice;
  relevantHistory: string;
};

const initialForm: FormValues = {
  ageRange: "", location: "", durationDays: "",
  symptoms: { redness: "", scaling: "", itching: "", dryness: "", pain: "", burning: "", swelling: "", recurrence: "" },
  previousEpisodes: "", familyHistory: "", previousDiagnosis: "", relevantHistory: "",
};

function buildAnswers(form: FormValues): SymptomAnswers | null {
  if (!form.ageRange || !form.location || form.durationDays === "" || Object.values(form.symptoms).some((value) => value === "") || !form.previousEpisodes || !form.familyHistory || !form.previousDiagnosis) return null;
  const parsed = SymptomAnswersSchema.safeParse({
    age_range: form.ageRange,
    body_location: form.location,
    duration_days: Number(form.durationDays),
    redness: form.symptoms.redness === "yes",
    scaling: form.symptoms.scaling === "yes",
    itching: form.symptoms.itching === "yes",
    dryness: form.symptoms.dryness === "yes",
    pain: form.symptoms.pain === "yes",
    burning: form.symptoms.burning === "yes",
    swelling: form.symptoms.swelling === "yes",
    recurrence: form.symptoms.recurrence === "yes",
    previous_similar_episodes: form.previousEpisodes,
    family_history: form.familyHistory,
    previous_professional_diagnosis: form.previousDiagnosis,
    ...(form.relevantHistory.trim() ? { relevant_skin_history: form.relevantHistory.trim() } : {}),
  });
  return parsed.success ? parsed.data : null;
}

function ChoiceButtons({ value, onChange, allowUnsure = false, label }: { value: string; onChange: (value: "yes" | "no" | "unsure") => void; allowUnsure?: boolean; label: string }) {
  const options = allowUnsure ? [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]] as const : [["yes", "Yes"], ["no", "No"]] as const;
  return <div aria-label={label} className="choice-row" role="group">{options.map(([key, text]) => <button aria-pressed={value === key} className="choice-button" key={key} onClick={() => onChange(key)} type="button">{text}</button>)}</div>;
}

export function ScanWizard() {
  const router = useRouter();
  const { t } = useLocale();
  const [step, setStep] = useState(0);
  const [consented, setConsented] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<ImageInspection | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [checkingImage, setCheckingImage] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const [form, setForm] = useState<FormValues>(initialForm);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  function clearImage() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl("");
    setFile(null);
    setInspection(null);
    setFileError("");
  }

  async function acceptFile(nextFile: File) {
    if (!consented) { setFileError("Please review and accept the screening consent before selecting an image."); return; }
    clearImage();
    const configuredLimit = Number(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE_MB ?? "10");
    const maxBytes = Math.min(10, Number.isFinite(configuredLimit) ? Math.max(1, configuredLimit) : 10) * 1024 * 1024;
    if (nextFile.size > maxBytes) { setFileError(`This image is larger than the ${((maxBytes / 1024 / 1024).toFixed(1))} MB limit. Choose a smaller file.`); return; }
    if (nextFile.size === 0) { setFileError("This file is empty. Choose a valid image."); return; }
    const objectUrl = URL.createObjectURL(nextFile);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setFileError("");
    setInspection(null);
    setCheckingImage(true);
    setFile(nextFile);
    try {
      const report = await inspectImageFile(nextFile);
      setInspection(report);
      if (!report.ok) setFileError(report.reasons.join(" "));
    } catch {
      setInspection(null);
      setFileError("We couldn’t check this image in your browser. Try another image or browser.");
    } finally { setCheckingImage(false); }
  }

  function changeForm(patch: Partial<FormValues>) {
    setForm((current) => ({ ...current, ...patch }));
    setFormError("");
  }

  function changeSymptom(key: (typeof symptomLabels)[number][0], value: "yes" | "no") {
    setForm((current) => ({ ...current, symptoms: { ...current.symptoms, [key]: value } }));
    setFormError("");
  }

  function continueFromSymptoms() {
    if (!buildAnswers(form)) {
      setFormError("Complete the required questions before continuing. You can select “Not sure” for history questions.");
      return;
    }
    setStep(3);
  }

  function discardAndFinish() {
    clearImage();
    setForm(initialForm);
    router.push("/dashboard");
  }

  const answers = buildAnswers(form);
  const fileSize = file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "";
  const configuredLimit = Number(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE_MB ?? "10");
  const maxSizeMb = Math.min(10, Number.isFinite(configuredLimit) ? Math.max(1, configuredLimit) : 10);

  return <AppShell><div className="page-heading-row"><div><span className="page-eyebrow">PRIVATE WORKSPACE · NEW SCAN</span><h1>Start a skin scan</h1><p>A guided screening workflow with clear limits. Your selected image and answers stay in this browser in the current preview build.</p></div><Link className="button button-outline button-small" href="/dashboard"><ArrowLeft size={14} /> Dashboard</Link></div>
    {!isSupabaseConfigured() && <div className="unavailable-banner" style={{ marginBottom: 18 }}><Info size={17} /><div><strong>Preview mode · no account or data storage configured</strong><p>This workflow does not upload or save your image, consent, or questionnaire. Leaving this page discards the local session.</p></div></div>}
    <div aria-label="Scan workflow progress" className="scan-progress">
      {stages.map((title, index) => <div aria-current={step === index ? "step" : undefined} className={`progress-step${step === index ? " active" : ""}${step > index ? " complete" : ""}`} key={title}><span className="progress-number">{step > index ? <Check size={12} /> : index + 1}</span><span>{title}</span></div>)}
    </div>

    {step === 0 && <section aria-labelledby="consent-heading" className="scan-card">
      <span className="page-eyebrow">STEP 01 · INFORMED CONSENT</span><h2 id="consent-heading" style={{ marginTop: 7 }}>Before you begin</h2><p>Understand what this tool can and cannot do before you choose an image.</p>
      <div className="consent-panel"><div><h3>Screening information, not a diagnosis</h3><p>{t("medical.disclaimer")}</p></div><div className="notice-card"><ShieldCheck size={17} /><div><strong>No validated AI model is connected</strong><p>This build will not create a screening prediction, probability, confidence score, or visual explanation.</p></div></div><label className="consent-check"><input checked={consented} onChange={(event) => setConsented(event.target.checked)} type="checkbox" /><span>{t("medical.consent")}</span></label></div>
      <div className="scan-actions"><span /> <button className="button button-primary" disabled={!consented} onClick={() => setStep(1)} type="button">Continue to image <ArrowRight size={15} /></button></div>
    </section>}

    {step === 1 && <section aria-labelledby="image-heading" className="scan-card">
      <span className="page-eyebrow">STEP 02 · IMAGE</span><h2 id="image-heading" style={{ marginTop: 7 }}>Choose a clear, unfiltered image</h2><p>Only supported image files are accepted. Basic checks happen locally in your browser; your image is not uploaded in this build.</p>
      <input accept="image/jpeg,image/png,image/webp" aria-label="Choose an image" className="sr-only" onChange={(event) => { const chosen = event.target.files?.[0]; if (chosen) void acceptFile(chosen); event.currentTarget.value = ""; }} ref={fileInputRef} type="file" />
      <input accept="image/jpeg,image/png,image/webp" aria-label="Capture an image with your camera" capture="environment" className="sr-only" onChange={(event) => { const chosen = event.target.files?.[0]; if (chosen) void acceptFile(chosen); event.currentTarget.value = ""; }} ref={cameraInputRef} type="file" />
      <div className="upload-grid">
        {file && previewUrl ? <div className="file-preview"><Image alt="Local preview of the selected skin image" fill sizes="(max-width: 620px) 100vw, 55vw" src={previewUrl} unoptimized /><button aria-label="Remove selected image" className="icon-plain file-remove" onClick={clearImage} type="button"><X size={17} /></button></div> : <div className={`drop-zone${dragging ? " dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { event.preventDefault(); setDragging(false); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setDragging(false); const dropped = event.dataTransfer.files?.[0]; if (dropped) void acceptFile(dropped); }}>
          <div><span className="upload-icon"><ImagePlus size={21} /></span><h3>Drag your image here</h3><p>or choose a file from your device</p><div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}><button className="button button-outline button-small" onClick={() => fileInputRef.current?.click()} type="button"><Upload size={14} /> Choose image</button><button className="button button-quiet button-small" onClick={() => cameraInputRef.current?.click()} type="button"><FileImage size={14} /> Use camera</button></div><small>JPEG, PNG, or WEBP · up to {maxSizeMb} MB</small></div>
        </div>}
        <aside className="upload-hints"><h3>For a useful photo</h3><div className="hint-row"><CheckCircle2 size={14} /><span>Use soft, natural light without flash glare.</span></div><div className="hint-row"><CheckCircle2 size={14} /><span>Hold the camera steady and keep the area in focus.</span></div><div className="hint-row"><CheckCircle2 size={14} /><span>Make sure the skin area is visible and avoid filters.</span></div><div className="hint-row"><CheckCircle2 size={14} /><span>Do not include faces or identifying details if they are not needed.</span></div><div className="technical-note">Local technical checks only. Skin visibility, obstruction, and clinical image quality are not assessed by this build.</div></aside>
      </div>
      {checkingImage && <div className="quality-result" role="status"><RotateCcw size={15} /><span>Checking file type, image dimensions, exposure, and a basic sharpness heuristic…</span></div>}
      {!checkingImage && inspection && (inspection.ok ? <div className="quality-result" role="status"><CheckCircle2 size={16} /><span><strong>Basic technical checks passed.</strong> {inspection.technicalChecks.join(" ")} The system has not checked for visible skin or clinical suitability.</span></div> : <div className="quality-result warning" role="alert"><AlertTriangle size={16} /><span><strong>Image quality is insufficient for a meaningful screening assessment.</strong> {inspection.reasons.join(" ")}</span></div>)}
      {fileError && !inspection && <div className="alert error" role="alert" style={{ marginTop: 13 }}>{fileError}</div>}
      {file && inspection && <div className="image-meta"><span><FileImage size={13} /> {file.name}</span><span>{fileSize}</span><span>{inspection.width > 0 ? `${inspection.width} × ${inspection.height}px` : "Image not decoded"}</span></div>}
      <div className="scan-actions"><button className="button button-outline" onClick={() => setStep(0)} type="button"><ArrowLeft size={14} /> Back</button><div className="scan-actions-right">{file && <button className="button button-quiet" onClick={clearImage} type="button"><RotateCcw size={14} /> Retake image</button>}<button className="button button-primary" disabled={!inspection?.ok || checkingImage} onClick={() => setStep(2)} type="button">Continue to symptoms <ArrowRight size={14} /></button></div></div>
    </section>}

    {step === 2 && <section aria-labelledby="symptoms-heading" className="scan-card">
      <span className="page-eyebrow">STEP 03 · SYMPTOM ASSESSMENT</span><h2 id="symptoms-heading" style={{ marginTop: 7 }}>Tell us what you’ve noticed</h2><p>These structured answers are shown only in the current browser session and are not saved or sent in preview mode.</p>
      <div className="question-group">
        <div className="question-field"><label htmlFor="age-range">Age range</label><select id="age-range" onChange={(event) => changeForm({ ageRange: event.target.value })} value={form.ageRange}><option value="">Choose a range</option><option value="under_18">Under 18</option><option value="18_24">18–24</option><option value="25_34">25–34</option><option value="35_44">35–44</option><option value="45_54">45–54</option><option value="55_64">55–64</option><option value="65_plus">65+</option><option value="prefer_not_to_say">Prefer not to say</option></select></div>
        <div className="question-field"><label htmlFor="body-location">Body location</label><select id="body-location" onChange={(event) => changeForm({ location: event.target.value })} value={form.location}><option value="">Choose an area</option><option value="scalp">Scalp</option><option value="face">Face</option><option value="neck">Neck</option><option value="chest">Chest</option><option value="back">Back</option><option value="arms">Arms</option><option value="hands">Hands</option><option value="legs">Legs</option><option value="feet">Feet</option><option value="other">Other</option></select></div>
        <div className="question-field"><label htmlFor="duration">How long have you noticed it? (days)</label><input id="duration" max="36500" min="0" onChange={(event) => changeForm({ durationDays: event.target.value })} placeholder="For example, 14" type="number" value={form.durationDays} /><span className="field-hint">Enter 0 if it was just noticed.</span></div>
        <div className="question-field"><label>Relevant skin history <span className="field-hint">(optional)</span></label><textarea maxLength={300} onChange={(event) => changeForm({ relevantHistory: event.target.value })} placeholder="Share only what you feel is relevant. Avoid names or identifying details." value={form.relevantHistory} /></div>
      </div>
      <h3 className="question-section-title">Current symptoms</h3>
      <div className="question-group">{symptomLabels.map(([key, label]) => <div className="question-field" key={key}><label>{label}</label><ChoiceButtons label={label} onChange={(value) => { if (value === "yes" || value === "no") changeSymptom(key, value); }} value={form.symptoms[key]} /></div>)}</div>
      <h3 className="question-section-title">History</h3>
      <div className="question-group">{[
        { key: "previousEpisodes", label: "Have you had similar episodes before?" },
        { key: "familyHistory", label: "Is there a relevant family skin history?" },
        { key: "previousDiagnosis", label: "Have you previously received a professional diagnosis for this area?" },
      ].map(({ key, label }) => <div className="question-field" key={key}><label>{label}</label><ChoiceButtons allowUnsure label={label} onChange={(value) => changeForm({ [key]: value } as Partial<FormValues>)} value={form[key as "previousEpisodes" | "familyHistory" | "previousDiagnosis"]} /></div>)}</div>
      {formError && <div className="alert error" role="alert" style={{ marginTop: 15 }}>{formError}</div>}
      <div className="scan-actions"><button className="button button-outline" onClick={() => setStep(1)} type="button"><ArrowLeft size={14} /> Back</button><button className="button button-primary" onClick={continueFromSymptoms} type="button">Review information <ArrowRight size={14} /></button></div>
    </section>}

    {step === 3 && inspection && answers && <section aria-labelledby="review-heading" className="scan-card">
      <span className="page-eyebrow">STEP 04 · REVIEW</span><h2 id="review-heading" style={{ marginTop: 7 }}>Your information, before anything else</h2><p>Check what you entered. Your image and answers remain local and will not be sent or saved in this build.</p>
      <div className="review-grid">
        <div className="review-panel"><h3><FileImage size={15} /> Image</h3><div className="review-line"><span>Selected file</span><strong>{file?.name ?? "No file selected"}</strong></div><div className="review-line"><span>Dimensions</span><strong>{inspection.width} × {inspection.height}px</strong></div><div className="review-line"><span>Technical check</span><strong>Basic checks passed</strong></div></div>
        <div className="review-panel"><h3><ClipboardCheckIcon /> Reported symptoms</h3><div className="review-line"><span>Age range</span><strong>{formatValue(answers.age_range)}</strong></div><div className="review-line"><span>Location</span><strong>{formatValue(answers.body_location)}</strong></div><div className="review-line"><span>Duration</span><strong>{answers.duration_days} days</strong></div><div className="review-line"><span>Symptoms reported</span><strong>{symptomLabels.filter(([key]) => answers[key]).map(([, label]) => label).join(", ") || "None selected"}</strong></div><div className="review-line"><span>Previous episodes</span><strong>{formatValue(answers.previous_similar_episodes)}</strong></div><div className="review-line"><span>Family history</span><strong>{formatValue(answers.family_history)}</strong></div><div className="review-line"><span>Previous professional diagnosis</span><strong>{formatValue(answers.previous_professional_diagnosis)}</strong></div></div>
      </div>
      <div className="model-unavailable-card"><div className="model-unavailable-icon"><LockKeyhole size={18} /></div><div><span className="model-status-label">{t("common.modelUnavailable")}</span><h3>No screening prediction will be generated.</h3><p>A validated model and private image-storage pipeline are not connected. Your image, consent, and questionnaire will not be uploaded, saved, or analyzed. No diagnosis, probability, confidence score, or visual evidence is available.</p><div className="model-next-step"><ShieldCheck size={14} /> If you have concerns, consider discussing them with a qualified healthcare professional.</div></div></div>
      <div className="disclaimer-result"><ShieldCheck size={16} /><strong>{t("medical.disclaimer")}</strong></div>
      <div className="scan-actions"><button className="button button-outline" onClick={() => setStep(2)} type="button"><ArrowLeft size={14} /> Edit answers</button><div className="scan-actions-right"><button className="button button-quiet" onClick={() => setStep(1)} type="button">Change image</button><button className="button button-primary" onClick={discardAndFinish} type="button">Discard local session <ArrowRight size={14} /></button></div></div>
    </section>}
    <p className="scan-footnote"><LockKeyhole size={12} /> This screening flow is not an emergency service and does not provide a medical diagnosis.</p>
  </AppShell>;
}

function formatValue(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ClipboardCheckIcon() { return <CheckCircle2 size={15} />; }
