import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { VereqApp } from "@/components/vereq/app";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VereqApp />
  </StrictMode>,
);
