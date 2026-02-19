// src/main.tsx
import React from "react";
import "./infrastructure/i18n";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.scss";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
