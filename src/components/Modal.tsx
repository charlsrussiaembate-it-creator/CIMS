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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm modal-backdrop-enter"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-[#0f172a] border border-[#334155] rounded-2xl shadow-2xl shadow-black/80 w-full ${maxWidth} modal-dialog-enter overflow-hidden`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0b1329]">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">{title}</h2>
            {subtitle && <p className="text-xs text-[#64748b] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-[#1e293b] transition-all"
            aria-label="Close modal"
          >
            <AppIcon name="close" size={14} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
