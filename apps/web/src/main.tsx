// TODO: [MIGRATION] After copying Lovable source files into src/, this file
// should be updated to match the Lovable main.tsx. The skeleton below is a
// minimal bootstrap that matches the existing Lovable structure.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
