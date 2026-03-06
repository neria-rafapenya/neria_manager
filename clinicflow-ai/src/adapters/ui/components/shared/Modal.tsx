import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Modal = ({
  isOpen,
  title,
  onClose,
  children,
  size = "md",
}: ModalProps) => {
  useEffect(() => {
    const body = document.body;
    if (isOpen) {
      body.classList.add("modal-open");
    } else {
      body.classList.remove("modal-open");
    }
    return () => {
      body.classList.remove("modal-open");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = size === "md" ? "" : `modal-${size}`;

  const modal = (
    <>
      <div
        className="modal fade show"
        style={{ display: "block", zIndex: 9999 }}
        role="dialog"
      >
        <div className={`modal-dialog modal-dialog-centered modal-lg ${sizeClass}`} role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
    </>
  );

  return createPortal(modal, document.body);
};
