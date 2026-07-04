import { buildApiUrl } from "../lib/api";
import { buildVideoApiError, parseVideoApiResponse } from "../lib/video-response";
import { supabase } from "@/lib/supabase";

export const generateVideo = async ({
  prompt,
  duration = 10,
  frame = "16:9",
  quality = "1080p",
  fps = 30,
  watermark = true,
  effects,
  provider,
  usageContext,
} = {}) => {
  const { data: sessionData } = await supabase?.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const response = await fetch(buildApiUrl("/generate"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(usageContext?.portal ? { "X-Portal": usageContext.portal } : {}),
      ...(usageContext?.usageType ? { "X-Usage-Type": usageContext.usageType } : {}),
      ...(usageContext?.skipCreditCheck ? { "X-Skip-Credit-Check": "true" } : {}),
    },
    body: JSON.stringify({
      prompt,
      duration,
      frame,
      quality,
      fps,
      watermark,
      effects,
      provider,
      usageContext,
    }),
  });

  const { data, rawBody, video, message } = await parseVideoApiResponse(response);
  const errorMessage = buildVideoApiError({ response, data, rawBody, message, video });

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  return { ...data, video };
};
