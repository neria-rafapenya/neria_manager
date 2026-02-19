// src/adapters/ui/react/chat/NewConversationModal.tsx
import type { FormEvent } from "react";

export interface NewConversationModalProps {
  open: boolean;
  title: string;
  onTitleChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export const NewConversationModal = ({
  open,
  title,
  onTitleChange,
  onCancel,
  onConfirm,
}: NewConversationModalProps) => {
  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm();
  };

  return (
    <div className="ia-chatbot-modal-backdrop">
      <div className="ia-chatbot-modal">
        <h2 className="ia-chatbot-modal-title">Nueva conversación</h2>
        <form onSubmit={handleSubmit}>
          <label className="ia-chatbot-modal-label">
            Título
            <input
              className="ia-chatbot-modal-input"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ej. Soporte facturación"
            />
          </label>
          <div className="ia-chatbot-modal-actions">
            <button
              type="button"
              className="ia-chatbot-button ia-chatbot-button-secondary"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="ia-chatbot-button ia-chatbot-button-primary"
              disabled={!title.trim()}
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
