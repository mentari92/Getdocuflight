"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle, FileImage, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import AuditResultsDisplay from "./AuditResultsDisplay";

// Next.js standard way to load the local pdf.worker to avoid CDN Mixed Content errors
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface DocumentAuditorProps {
    predictionId: string;
    existingAudit?: any;
}

export default function DocumentAuditor({ predictionId, existingAudit }: DocumentAuditorProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [progressMsgs, setProgressMsgs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [auditResult, setAuditResult] = useState<any>(existingAudit);

    const processPdfToImages = async (file: File): Promise<File[]> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const outputFiles: File[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            setProgressMsgs(prev => [...prev, `Converting PDF page ${i} of ${pdf.numPages}...`]);
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better OCR clarity

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: ctx, viewport } as any).promise;

            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
            if (blob) {
                outputFiles.push(new File([blob], `${file.name.replace('.pdf', '')}_page_${i}.jpg`, { type: "image/jpeg" }));
            }
        }
        return outputFiles;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setLoading(true);
            setError(null);
            setProgressMsgs([]);

            const selected = Array.from(e.target.files);
            let processedImages: File[] = [];

            try {
                for (const file of selected) {
                    if (file.type === "application/pdf") {
                        const imagesFromPdf = await processPdfToImages(file);
                        processedImages = [...processedImages, ...imagesFromPdf];
                    } else if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                        processedImages.push(file);
                    } else {
                        throw new Error("Invalid file type. Only PDF/JPG/PNG/WEBP are allowed.");
                    }
                }

                // Done processing this batch, append to state
                setFiles(prev => {
                    const combined = [...prev, ...processedImages];
                    if (combined.length > 5) {
                        setError("Too many pages/files. Maximum is 5 images/pages combined. Discarding excess.");
                        return combined.slice(0, 5);
                    }
                    return combined;
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
                setProgressMsgs([]);
            }
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setLoading(true);
        setError(null);

        const formData = new FormData();
        files.forEach(f => formData.append("files", f));

        try {
            const res = await fetch(`/api/predictions/${predictionId}/audit`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            setAuditResult(data.auditResult);
            // Discard files after secure processing
            setFiles([]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (auditResult) {
        return <AuditResultsDisplay result={auditResult} />;
    }

    return (
        <div className="bg-surface border border-gold-border/30 rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🔎</span>
                    <div>
                        <h3 className="text-lg font-bold text-heading font-heading">Smart Document Auditor</h3>
                        <p className="text-sm text-body">Upload your supporting documents for an AI Gap Analysis.</p>
                    </div>
                </div>
                <span className="px-3 py-1 bg-gold-light/20 text-gold-dark text-xs font-bold rounded-full border border-gold-border/50 uppercase">
                    Premium Feature
                </span>
            </div>

            <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${files.length > 0 ? "border-primary bg-primary-50/30" : "border-gold-border/30 hover:border-gold-border/50 bg-cream/10"}`}>
                <UploadCloud className="w-10 h-10 mx-auto text-muted mb-3" />
                <h4 className="text-md font-semibold text-heading mb-1">Upload Documents</h4>
                <p className="text-xs text-body mb-4">Support for PDF, JPG, PNG, WEBP (Max 5 pages/images combined).</p>

                <input
                    type="file"
                    id="doc-upload"
                    multiple
                    accept="application/pdf,image/jpeg,image/png,image/webp"

                    className="hidden"
                    onChange={handleFileChange}
                    disabled={loading}
                />

                <label
                    htmlFor="doc-upload"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gold-border/50 text-heading text-sm font-bold rounded-xl cursor-pointer hover:bg-gold-light/10 transition-colors shadow-sm"
                >
                    <FileImage className="w-4 h-4" />
                    Select Files
                </label>

                {files.length > 0 && (
                    <div className="mt-5 space-y-2 text-left bg-white p-4 rounded-xl shadow-sm border border-gold-border/20">
                        <p className="text-xs font-bold text-heading uppercase">Selected Files:</p>
                        {files.map((f, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <span className="truncate text-body text-xs"><span className="text-primary mr-2">✓</span>{f.name}</span>
                                <span className="text-muted text-xs">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 p-3 bg-error-light/50 border border-error/20 rounded-xl flex items-start gap-2 text-error text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="mt-5 flex justify-end">
                <button
                    onClick={handleUpload}
                    disabled={files.length === 0 || loading}
                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">
                                {progressMsgs.length > 0 ? progressMsgs[progressMsgs.length - 1] : "Analyzing Documents..."}
                            </span>
                        </div>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            Run Smart Audit
                        </>
                    )}
                </button>
            </div>
            <p className="mt-4 text-[10px] text-center text-muted flex items-center justify-center gap-1">
                <span className="text-error">🔒</span> Your documents are securely processed and immediately deleted. We do not store sensitive files.
            </p>
        </div>
    );
}
