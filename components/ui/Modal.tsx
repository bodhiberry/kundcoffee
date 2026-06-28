"use client";
import { FC, ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  noPadding?: boolean;
  size?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "full";
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  noPadding = false,
  size = "md",
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "w-[95vw] max-w-md",
    md: "w-[95vw] max-w-2xl",
    lg: "w-[95vw] max-w-4xl",
    xl: "w-[90vw] max-w-5xl",
    "2xl": "w-[90vw] max-w-6xl",
    "3xl": "w-[92vw] max-w-[1200px]",
    "4xl": "w-[94vw] max-w-[1400px]",
    "5xl": "w-[95vw] max-w-[1600px]",
    "6xl": "w-[96vw] max-w-[1800px]",
    full: "w-[98vw] h-[96vh]",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{
        zIndex:
          60 +
          document.querySelectorAll(".fixed.inset-0.z-\\[60\\]").length * 10,
      }}
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out"
        onClick={onClose}
      />
      <div
        className={`relative transform rounded-2xl bg-white text-left shadow-2xl transition-all duration-300 ease-out ${sizeClasses[size]} sm:scale-100 opacity-100 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 flex flex-col max-h-[92vh] ${noPadding ? "p-0 overflow-hidden" : "p-6"}`}
      >
        {/* Only show built-in header when title is provided and noPadding is false */}
        {!noPadding && title && (
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4 shrink-0">
            <h3 className="text-xl font-bold leading-6 text-gray-900 tracking-tight">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className={`flex-1 min-h-0 ${noPadding ? "overflow-hidden" : "overflow-y-auto custom-scrollbar pr-2 -mr-2"}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};