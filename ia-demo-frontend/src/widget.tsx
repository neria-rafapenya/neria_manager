// src/widget.ts
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

export interface MountOptions {
  elementId: string;
}

interface WidgetInstance {
  root: ReactDOM.Root;
}

const instances = new Map<string, WidgetInstance>();

const mount = ({ elementId }: MountOptions): void => {
  const el = document.getElementById(elementId);

  if (!el) {
    throw new Error(
      `[IAChatWidget] No se ha encontrado el elemento con id="${elementId}".`
    );
  }

  let instance = instances.get(elementId);

  if (!instance) {
    const root = ReactDOM.createRoot(el);
    instance = { root };
    instances.set(elementId, instance);
  }

  instance.root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const unmount = (elementId: string): void => {
  const instance = instances.get(elementId);
  if (instance) {
    instance.root.unmount();
    instances.delete(elementId);
  }
};

const IAChatWidget = { mount, unmount };

export default IAChatWidget;

declare global {
  interface Window {
    IAChatWidget?: typeof IAChatWidget;
  }
}

if (typeof window !== "undefined") {
  window.IAChatWidget = IAChatWidget;
}
