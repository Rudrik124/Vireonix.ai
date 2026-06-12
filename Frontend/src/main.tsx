
  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);

  // Export LoginActivityPage for optional route registration elsewhere
  export { default as LoginActivityPage } from "./app/developer/login-activity-page";
  