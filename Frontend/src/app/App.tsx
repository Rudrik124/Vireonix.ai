import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/auth-context";
import { useErrorLogging } from "../hooks/useErrorLogging";

function MainApp() {
  // Initialize error logging
  useErrorLogging();

  return <RouterProvider router={router} fallbackElement={<div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
