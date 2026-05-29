import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/auth-context";
import { useErrorLogging } from "../hooks/useErrorLogging";

function MainApp() {
  // Initialize error logging
  useErrorLogging();

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
