import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { AppIcon } from "./Icons";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  subtitle?: string;
}

export default function Modal({
  title,
  onClose,
  children,
  maxWidth = "max-w-lg",
  subtitle,
}: ModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs modal-backdrop-enter"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white border border-slate-200 rounded-2xl shadow-xl w-full ${maxWidth} modal-dialog-enter overflow-hidden text-slate-900 font-sans`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h2 className="text-base font-serif font-bold text-slate-900 tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <AppIcon name="close" size={14} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto text-slate-800">{children}</div>
      </div>
    </div>,
    document.body
  );
}
