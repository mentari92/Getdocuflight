"use client";

/**
 * DocumentUploadZone — File upload UI with 4 slots.
 *
 * Slots:
 *  1. Bank Statement (required)
 *  2. Employment Letter (required)
 *  3. Salary Slip (optional)
 *  4. Passport Visa Pages (optional)
 *
 * Features:
 *  - Drag & drop + click to browse
 *  - File type validation (PDF/JPG/PNG)
 *  - File size validation (max 10MB)
 *  - Upload progress indicator
 *  - ClamAV scan status
 *  - Success/error states per file
 *  - NO KTP slot, NO passport biometric page
 */

import { useState, useRef, useCallback } from "react";

interface DocumentSlot {
    fieldName: string;
    label: string;
    required: boolean;
    icon: string;
    description: string;
}

const DOCUMENT_SLOTS: DocumentSlot[] = [
    {
        fieldName: "bank_statement",
        label: "Bank Statement",
        required: true,
        icon: "🏦",
        description: "Last 3 months transaction history",
    },
    {
        fieldName: "employment_letter",
        label: "Employment Letter",
        required: true,
        icon: "📄",
        description: "Current employer verification",
    },
    {
        fieldName: "salary_slip",
        label: "Salary Slip",
        required: false,
        icon: "💰",
        description: "Latest 1-3 months (optional)",
    },
    {
        fieldName: "passport_stamps",
        label: "Passport Visa Pages",
        required: false,
        icon: "🛂",
        description: "Visa stamps and entry/exit pages only — NOT the photo page",
    },
];

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type FileStatus =
    | "idle"
    | "selected"
    | "uploading"
    | "scanning"
    | "encrypting"
    | "success"
    | "error";

interface FileState {
    file: File | null;
    status: FileStatus;
    error?: string;
    documentId?: string;
}

interface DocumentUploadZoneProps {
    predictionId: string;
    onUploadComplete: () => void;
}

export default function DocumentUploadZone({
    predictionId,
    onUploadComplete,
}: DocumentUploadZoneProps) {
    const [fileStates, setFileStates] = useState<Record<string, FileState>>(
        () => {
            const initial: Record<string, FileState> = {};
            for (const slot of DOCUMENT_SLOTS) {
                initial[slot.fieldName] = { file: null, status: "idle" };
            }
            return initial;
        }
    );
    const [isUploading, setIsUploading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const hasRequiredFiles = DOCUMENT_SLOTS.filter((s) => s.required).every(
        (s) =>
            fileStates[s.fieldName]?.file ||
            fileStates[s.fieldName]?.status === "success"
    );

    const hasAnyFile = Object.values(fileStates).some((s) => s.file);

    const allDone = Object.values(fileStates).every(
        (s) => s.status === "idle" || s.status === "success"
    );

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return `Unsupported format. Only PDF, JPG, PNG are accepted.`;
        }
        if (file.size > MAX_FILE_SIZE) {
            return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`;
        }
        return null;
    };

    const handleFileSelect = useCallback(
        (fieldName: string, file: File | null) => {
            if (!file) return;

            const error = validateFile(file);
            if (error) {
                setFileStates((prev) => ({
                    ...prev,
                    [fieldName]: { file: null, status: "error", error },
                }));
                return;
            }

            setFileStates((prev) => ({
                ...prev,
                [fieldName]: { file, status: "selected" },
            }));
        },
        []
    );

    const handleDrop = useCallback(
        (fieldName: string, e: React.DragEvent) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(fieldName, file);
        },
        [handleFileSelect]
    );

    const handleRemoveFile = (fieldName: string) => {
        setFileStates((prev) => ({
            ...prev,
            [fieldName]: { file: null, status: "idle" },
        }));
    };

    const handleUploadAll = async () => {
        setIsUploading(true);
        setGlobalError(null);

        // Capture files to upload BEFORE state update (Fix #4 — avoids stale closure)
        const filesToUpload: Array<{ fieldName: string; file: File }> = [];
        for (const slot of DOCUMENT_SLOTS) {
            const state = fileStates[slot.fieldName];
            if (state.file && state.status === "selected") {
                filesToUpload.push({ fieldName: slot.fieldName, file: state.file });
            }
        }

        if (filesToUpload.length === 0) {
            setIsUploading(false);
            return;
        }

        // Mark selected files as processing (Fix #5 — single honest state)
        setFileStates((prev) => {
            const next = { ...prev };
            for (const { fieldName } of filesToUpload) {
                next[fieldName] = { ...next[fieldName], status: "uploading" };
            }
            return next;
        });

        try {
            const formData = new FormData();
            formData.append("predictionId", predictionId);

            for (const { fieldName, file } of filesToUpload) {
                formData.append(fieldName, file);
            }

            const response = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            // Mark all uploaded files as success
            setFileStates((prev) => {
                const next = { ...prev };
                for (const doc of data.documents) {
                    // Find which slot this document type maps to
                    const slot = DOCUMENT_SLOTS.find((s) => {
                        const typeMap: Record<string, string> = {
                            bank_statement: "BANK_STATEMENT",
                            employment_letter: "EMPLOYMENT_LETTER",
                            salary_slip: "SALARY_SLIP",
                            passport_stamps: "PASSPORT_STAMPS",
                        };
                        return typeMap[s.fieldName] === doc.fileType;
                    });
                    if (slot) {
                        next[slot.fieldName] = {
                            ...next[slot.fieldName],
                            status: "success",
                            documentId: doc.documentId,
                        };
                    }
                }
                return next;
            });
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Upload failed. Please try again.";
            setGlobalError(message);

            // Mark failed files as error
            setFileStates((prev) => {
                const next = { ...prev };
                for (const key of Object.keys(next)) {
                    if (
                        next[key].status === "scanning" ||
                        next[key].status === "encrypting" ||
                        next[key].status === "uploading"
                    ) {
                        next[key] = {
                            ...next[key],
                            status: "error",
                            error: message,
                        };
                    }
                }
                return next;
            });
        } finally {
            setIsUploading(false);
        }
    };

    const getStatusDisplay = (status: FileStatus) => {
        switch (status) {
            case "scanning":
                return {
                    text: "Checking file security...",
                    color: "text-amber-600",
                    icon: "🔍",
                };
            case "encrypting":
                return {
                    text: "Encrypting file...",
                    color: "text-primary",
                    icon: "🔒",
                };
            case "uploading":
                return {
                    text: "Uploading securely...",
                    color: "text-primary",
                    icon: "📤",
                };
            case "success":
                return {
                    text: "✓ Encrypted and secure",
                    color: "text-primary",
                    icon: "✅",
                };
            default:
                return null;
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">📤</span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-heading font-heading">
                        Upload Documents
                    </h2>
                </div>
                <p className="text-sm text-muted">
                    Upload your documents for a more accurate visa prediction.
                    Files are encrypted and auto-deleted after 24 hours.
                </p>
            </div>

            {/* File format info */}
            <div className="flex items-center gap-3 px-4 py-3 bg-cream rounded-xl">
                <span className="text-base">📎</span>
                <span className="text-xs text-muted">
                    Accepted formats: <strong>PDF, JPG, PNG</strong> · Max 10MB
                    per file · Max 4 files
                </span>
            </div>

            {/* Upload Slots */}
            <div className="space-y-4">
                {DOCUMENT_SLOTS.map((slot) => {
                    const state = fileStates[slot.fieldName];
                    const statusDisplay = getStatusDisplay(state.status);
                    const isProcessing = [
                        "scanning",
                        "encrypting",
                        "uploading",
                    ].includes(state.status);

                    return (
                        <div
                            key={slot.fieldName}
                            className={`border-2 border-dashed rounded-2xl p-5 transition-all duration-200 ${state.status === "success"
                                ? "border-primary/50 bg-primary/5"
                                : state.status === "error"
                                    ? "border-error/50 bg-error-light/20"
                                    : state.file
                                        ? "border-primary/30 bg-surface"
                                        : "border-gold-border hover:border-primary/30 bg-surface"
                                }`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add(
                                    "border-primary",
                                    "bg-primary/5"
                                );
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove(
                                    "border-primary",
                                    "bg-primary/5"
                                );
                            }}
                            onDrop={(e) => handleDrop(slot.fieldName, e)}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-2xl mt-0.5">
                                    {slot.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-bold text-heading">
                                            {slot.label}
                                        </h3>
                                        {slot.required ? (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-error-light text-error rounded-full font-semibold">
                                                Required
                                            </span>
                                        ) : (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-cream text-muted rounded-full font-medium">
                                                Optional
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted mb-3">
                                        {slot.description}
                                    </p>

                                    {/* File selected / status */}
                                    {state.file && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-medium text-heading truncate max-w-[200px]">
                                                📁 {state.file.name}
                                            </span>
                                            <span className="text-xs text-muted">
                                                (
                                                {(
                                                    state.file.size /
                                                    1024 /
                                                    1024
                                                ).toFixed(1)}
                                                MB)
                                            </span>
                                            {!isProcessing &&
                                                state.status !== "success" && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveFile(
                                                                slot.fieldName
                                                            )
                                                        }
                                                        className="text-xs text-error hover:underline cursor-pointer ml-auto"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                        </div>
                                    )}

                                    {/* Processing status */}
                                    {statusDisplay && (
                                        <div className="flex items-center gap-2">
                                            {isProcessing && (
                                                <svg
                                                    className="w-4 h-4 animate-spin text-primary"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                    />
                                                </svg>
                                            )}
                                            <span
                                                className={`text-xs font-semibold ${statusDisplay.color}`}
                                            >
                                                {statusDisplay.text}
                                            </span>
                                        </div>
                                    )}

                                    {/* Error */}
                                    {state.status === "error" &&
                                        state.error && (
                                            <p className="text-xs text-error mt-1">
                                                ❌ {state.error}
                                            </p>
                                        )}

                                    {/* Browse button */}
                                    {!state.file &&
                                        state.status !== "success" && (
                                            <>
                                                <input
                                                    ref={(el) => {
                                                        inputRefs.current[
                                                            slot.fieldName
                                                        ] = el;
                                                    }}
                                                    type="file"
                                                    accept={ACCEPTED_EXTENSIONS}
                                                    className="hidden"
                                                    onChange={(e) =>
                                                        handleFileSelect(
                                                            slot.fieldName,
                                                            e.target.files?.[0] ??
                                                            null
                                                        )
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        inputRefs.current[
                                                            slot.fieldName
                                                        ]?.click()
                                                    }
                                                    disabled={isUploading}
                                                    className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors cursor-pointer"
                                                >
                                                    Drag & drop or click to
                                                    browse
                                                </button>
                                            </>
                                        )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Global error */}
            {globalError && (
                <div className="p-3 bg-error-light/30 border border-error/30 rounded-xl text-sm text-error">
                    {globalError}
                </div>
            )}

            {/* Upload Button */}
            <button
                onClick={handleUploadAll}
                disabled={!hasAnyFile || isUploading || (allDone && !hasAnyFile)}
                className={`w-full py-4 font-bold text-base rounded-xl transition-all duration-200 ${hasAnyFile && !isUploading
                    ? "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    : "bg-gold-border/30 text-muted cursor-not-allowed"
                    } disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
                {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg
                            className="w-5 h-5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                        Processing documents securely...
                    </span>
                ) : hasRequiredFiles ? (
                    "Analyze My Documents"
                ) : (
                    "Upload required documents to continue"
                )}
            </button>

            {/* Analyze trigger — once all uploads complete */}
            {allDone &&
                Object.values(fileStates).some(
                    (s) => s.status === "success"
                ) && (
                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-xl text-sm text-primary font-medium">
                            ✓ All documents uploaded successfully
                        </div>
                        <button
                            onClick={onUploadComplete}
                            className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                            🔍 Start Document Re-Analysis
                        </button>
                    </div>
                )}

            {/* Safety note */}
            <p className="text-xs text-subtle text-center">
                🔒 Files are scanned for malware, encrypted with AES-256,
                and stored on GDPR-compliant EU servers. Auto-deleted after 24h.
            </p>
        </div>
    );
}
