import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// The library's bundle doesn't import its own CSS, so pull it in here.
// Before index.css, so app styles still win on equal specificity.
import "@dashalundqvist/editor_ui_poc/style.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
