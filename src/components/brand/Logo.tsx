"use client";

import { PlaneTakeoff } from "lucide-react";

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
    showText?: boolean;
    textColor?: string;
}

export default function Logo({ className = "", iconOnly = false, showText = true, textColor = "text-[#2D2D2D]" }: LogoProps) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {showText && !iconOnly && (
                <span className={`text-xl md:text-2xl font-extrabold ${textColor} tracking-tight font-heading`}>
                    GetDocuFlight
                </span>
            )}
            <div className="relative flex flex-col items-center justify-center pt-1.5">
                <PlaneTakeoff className="w-6 h-6 md:w-8 md:h-8 text-primary" strokeWidth={2.5} />
            </div>
        </div>
    );
}
