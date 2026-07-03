type VideoApiPayload = {
  success?: boolean;
  error?: unknown;
  detail?: unknown;
  message?: unknown;
  video?: unknown;
  videoUrl?: unknown;
  url?: unknown;
  storage?: string;
};

const asNonEmptyString = (value: unknown) => {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
};

export const parseVideoApiResponse = async (response: Response) => {
  const rawBody = await response.text();
  let data: VideoApiPayload = {};

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = { error: rawBody };
    }
  }

  const video =
    asNonEmptyString(data?.video) ||
    asNonEmptyString(data?.videoUrl) ||
    asNonEmptyString(data?.url);

  const message =
    asNonEmptyString(data?.error) ||
    asNonEmptyString(
      typeof data?.error === "object" && data?.error ? (data.error as { message?: unknown }).message : "",
    ) ||
    asNonEmptyString(data?.detail) ||
    asNonEmptyString(data?.message);

  return { data, rawBody, video, message };
};

export const buildVideoApiError = ({
  response,
  data,
  rawBody,
  message,
  video,
}: {
  response: Response;
  data: VideoApiPayload;
  rawBody: string;
  message: string;
  video: string;
}) => {
  if (response.ok && data?.success === true && video) {
    return "";
  }

  const fallbackSnippet = rawBody ? rawBody.slice(0, 1000) : "The backend response body was completely empty.";
  const shapeHint =
    response.ok && data?.success === true && !video
      ? " Server returned success but no playable video URL."
      : "";

  return (
    message ||
    `Video generation failed (status ${response.status}). Raw Response: ${fallbackSnippet}${shapeHint}`
  );
};
