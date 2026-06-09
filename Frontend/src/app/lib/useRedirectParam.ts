import { useSearchParams } from "react-router";

/**
 * Hook to get the redirect parameter from URL query string
 * @returns The redirect path if available, otherwise null
 */
export function useRedirectParam() {
  const [searchParams] = useSearchParams();
  return searchParams.get("redirect");
}
