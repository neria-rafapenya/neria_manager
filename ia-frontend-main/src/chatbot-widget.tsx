import ReactDOM from "react-dom/client";
import { ChatbotApp } from "./adapters/ui/components/ChatbotApp";

// 👇 ESTILOS DEL CHATBOT: punto de entrada global
import "./index.scss";

export interface NeriaChatbotConfig {
  apiBaseUrl?: string;
  authMode?: "none" | "local" | "sso";
}

// 👇 Guardamos un root por container para no llamar createRoot dos veces
const roots = new WeakMap<HTMLElement, ReactDOM.Root>();

/**
 * Monta el chatbot dentro de un contenedor DOM.
 * Esta función es la que exporta la librería "ChatbotWidget" (global iife).
 */
export function mount(container: HTMLElement, _config?: NeriaChatbotConfig) {
  let root = roots.get(container);

  if (!root) {
    root = ReactDOM.createRoot(container);
    roots.set(container, root);
  }

  root.render(<ChatbotApp />);
  return root;
}

// También colgamos un helper directo en window
declare global {
  interface Window {
    mountNeriaChatbot?: (
      container: HTMLElement,
      config?: NeriaChatbotConfig
    ) => void;
    ChatbotWidget?: {
      mount: (container: HTMLElement, config?: NeriaChatbotConfig) => void;
    };
  }
}

if (typeof window !== "undefined") {
  window.mountNeriaChatbot = (container, config) => {
    mount(container, config);
  };

  if (!window.ChatbotWidget) {
    window.ChatbotWidget = {
      mount: (container, config) => {
        mount(container, config);
      },
    };
  } else {
    window.ChatbotWidget.mount = (container, config) => {
      mount(container, config);
    };
  }
}
