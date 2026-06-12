import { fetchWithAuth } from "./fetch-with-error-logging";

// Helper to detect device/browser/os info on client-side
export function detectDeviceInfo() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const ip = null; // IP must be resolved server-side or via external service

  // Basic browser detection
  let browser = "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edge") && !ua.includes("OPR")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";
  else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";

  // Basic OS detection
  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";

  // Device name - best effort
  const deviceName = platform || os;

  return { device_name: deviceName, browser, operating_system: os, user_agent: ua, ip_address: ip };
}

export async function recordLoginActivity(session: any, profile: any) {
  if (!session?.access_token || !session?.user) {
    return;
  }

  const device = detectDeviceInfo();
  const accessToken = session.access_token;

  if (accessToken) {
    (window as any).__VIREONIX_AUTH_TOKEN = accessToken;
    localStorage.setItem("__VIREONIX_AUTH_TOKEN", accessToken);
  }

  try {
    await fetchWithAuth(`/api/developer/login-activity/record`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "login",
        user_id: session.user.id,
        user_name: profile?.fullName || session.user.email,
        user_email: session.user.email,
        user_role: profile?.role || "user",
        session_id: accessToken,
        device_name: device.device_name,
        browser: device.browser,
        operating_system: device.operating_system,
        ip_address: device.ip_address,
        metadata: { user_agent: device.user_agent },
      }),
    });
  } catch (error) {
    console.warn("Failed to record login activity:", error);
  }
}
