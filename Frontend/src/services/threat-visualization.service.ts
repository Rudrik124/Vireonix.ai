import { supabase } from "@/lib/supabase";

export type ThreatType = "FAILED_LOGIN" | "BLOCKED_REQUEST" | "SECURITY_EVENT";
export type ThreatSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CountryThreatData {
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  failedLogins: number;
  blockedRequests: number;
  securityEvents: number;
  totalThreats: number;
  severity: ThreatSeverity;
  ipAddresses: string[];
  lastIncident: string;
}

export interface ThreatMetrics {
  totalThreats: number;
  failedLoginCount: number;
  blockedRequestCount: number;
  securityEventCount: number;
  criticalCountries: number;
  highSeverityCountries: number;
  uniqueCountries: number;
  uniqueIPs: number;
}

export interface ThreatIncident {
  id: string;
  country: string;
  countryCode: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  description: string;
  ipAddress: string;
  timestamp: string;
  details?: string;
}

export interface ThreatFilterOptions {
  startDate?: string;
  endDate?: string;
  threatType?: ThreatType;
  minSeverity?: ThreatSeverity;
  country?: string;
}

export interface CountryRanking {
  rank: number;
  country: string;
  countryCode: string;
  threatScore: number;
  failedLogins: number;
  blockedRequests: number;
  securityEvents: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

/**
 * IP to Country mapping for geolocation
 * In production, use a proper GeoIP database
 */
const IP_COUNTRY_MAP: Record<string, { country: string; code: string; lat: number; lng: number }> = {
  "10.": { country: "Internal Network", code: "INT", lat: 20, lng: 0 },
  "172.": { country: "Internal Network", code: "INT", lat: 20, lng: 0 },
  "192.": { country: "Internal Network", code: "INT", lat: 20, lng: 0 },
  // Default regions - in production use MaxMind GeoIP2 or similar
  "": { country: "Unknown", code: "UNK", lat: 0, lng: 0 },
};

/**
 * Extract country from IP address metadata
 */
function extractCountryFromIP(metadata?: Record<string, any>): {
  country: string;
  code: string;
  lat: number;
  lng: number;
} {
  if (metadata?.country) {
    return {
      country: metadata.country,
      code: metadata.countryCode || "UNK",
      lat: metadata.latitude || 0,
      lng: metadata.longitude || 0,
    };
  }

  const ipAddress = metadata?.ip_address || "";
  for (const [prefix, data] of Object.entries(IP_COUNTRY_MAP)) {
    if (prefix === "" || ipAddress.startsWith(prefix)) {
      return data;
    }
  }

  return IP_COUNTRY_MAP[""];
}

/**
 * Calculate threat severity based on incident count
 */
function calculateSeverity(failedLogins: number, blockedRequests: number, securityEvents: number): ThreatSeverity {
  const total = failedLogins + blockedRequests + securityEvents;
  if (total >= 100) return "CRITICAL";
  if (total >= 50) return "HIGH";
  if (total >= 10) return "MEDIUM";
  return "LOW";
}

/**
 * Fetch country threat data with filters
 */
export async function fetchCountryThreats(filters: ThreatFilterOptions = {}): Promise<CountryThreatData[]> {
  try {
    let query = supabase
      .from("security_events")
      .select("id, description, metadata, severity, created_at");

    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    // Group by country
    const countryMap = new Map<string, CountryThreatData>();

    (data || []).forEach((event: any) => {
      const metadata = typeof event.metadata === "string" ? JSON.parse(event.metadata) : event.metadata;
      const geoData = extractCountryFromIP(metadata);

      const threatType = determineThreatType(event.description, event.severity);

      if (!countryMap.has(geoData.country)) {
        countryMap.set(geoData.country, {
          country: geoData.country,
          countryCode: geoData.code,
          latitude: geoData.lat,
          longitude: geoData.lng,
          failedLogins: 0,
          blockedRequests: 0,
          securityEvents: 0,
          totalThreats: 0,
          severity: "LOW",
          ipAddresses: [],
          lastIncident: event.created_at,
        });
      }

      const countryData = countryMap.get(geoData.country)!;

      if (threatType === "FAILED_LOGIN") countryData.failedLogins++;
      else if (threatType === "BLOCKED_REQUEST") countryData.blockedRequests++;
      else countryData.securityEvents++;

      countryData.totalThreats++;
      if (!countryData.ipAddresses.includes(metadata.ip_address)) {
        countryData.ipAddresses.push(metadata.ip_address);
      }
      countryData.lastIncident = event.created_at;
    });

    // Calculate severity and filter
    const results = Array.from(countryMap.values())
      .map((country) => ({
        ...country,
        severity: calculateSeverity(
          country.failedLogins,
          country.blockedRequests,
          country.securityEvents
        ),
      }))
      .filter((country) => {
        if (filters.country && country.country !== filters.country) return false;
        if (filters.minSeverity) {
          const severityOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
          return severityOrder[country.severity] >= severityOrder[filters.minSeverity];
        }
        return true;
      })
      .sort((a, b) => b.totalThreats - a.totalThreats);

    return results;
  } catch (error) {
    console.error("Error fetching country threats:", error);
    throw new Error("Failed to fetch country threats");
  }
}

/**
 * Determine threat type from description
 */
function determineThreatType(description: string, severity: string): ThreatType {
  const desc = description.toLowerCase();
  if (desc.includes("login") || desc.includes("authentication")) return "FAILED_LOGIN";
  if (desc.includes("blocked") || desc.includes("request")) return "BLOCKED_REQUEST";
  return "SECURITY_EVENT";
}

/**
 * Fetch threat metrics
 */
export async function fetchThreatMetrics(filters: ThreatFilterOptions = {}): Promise<ThreatMetrics> {
  try {
    const countryThreats = await fetchCountryThreats(filters);

    const criticalCountries = countryThreats.filter((c) => c.severity === "CRITICAL").length;
    const highSeverityCountries = countryThreats.filter((c) => c.severity === "HIGH").length;
    const uniqueIPs = new Set<string>();

    countryThreats.forEach((country) => {
      country.ipAddresses.forEach((ip) => uniqueIPs.add(ip));
    });

    return {
      totalThreats: countryThreats.reduce((sum, c) => sum + c.totalThreats, 0),
      failedLoginCount: countryThreats.reduce((sum, c) => sum + c.failedLogins, 0),
      blockedRequestCount: countryThreats.reduce((sum, c) => sum + c.blockedRequests, 0),
      securityEventCount: countryThreats.reduce((sum, c) => sum + c.securityEvents, 0),
      criticalCountries,
      highSeverityCountries,
      uniqueCountries: countryThreats.length,
      uniqueIPs: uniqueIPs.size,
    };
  } catch (error) {
    console.error("Error fetching threat metrics:", error);
    throw new Error("Failed to fetch threat metrics");
  }
}

/**
 * Get top threatening countries
 */
export async function fetchTopThreats(filters: ThreatFilterOptions = {}, limit: number = 20): Promise<CountryRanking[]> {
  try {
    const countryThreats = await fetchCountryThreats(filters);

    const threatScores = countryThreats.map((country) => ({
      rank: 0,
      country: country.country,
      countryCode: country.countryCode,
      threatScore: calculateThreatScore(country),
      failedLogins: country.failedLogins,
      blockedRequests: country.blockedRequests,
      securityEvents: country.securityEvents,
      riskLevel: country.severity as any,
    }));

    // Assign ranks
    threatScores.sort((a, b) => b.threatScore - a.threatScore);
    threatScores.forEach((item, index) => {
      item.rank = index + 1;
    });

    return threatScores.slice(0, limit);
  } catch (error) {
    console.error("Error fetching top threats:", error);
    throw new Error("Failed to fetch top threats");
  }
}

/**
 * Calculate threat score for ranking
 */
function calculateThreatScore(country: CountryThreatData): number {
  // Weighted scoring
  const failedLoginWeight = 2;
  const blockedRequestWeight = 3;
  const securityEventWeight = 5;

  return (
    country.failedLogins * failedLoginWeight +
    country.blockedRequests * blockedRequestWeight +
    country.securityEvents * securityEventWeight
  );
}

/**
 * Fetch threat incidents by country
 */
export async function fetchThreatIncidents(
  filters: ThreatFilterOptions = {},
  limit: number = 100
): Promise<ThreatIncident[]> {
  try {
    let query = supabase
      .from("security_events")
      .select("id, description, metadata, severity, created_at")
      .limit(limit);

    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((event: any) => {
      const metadata = typeof event.metadata === "string" ? JSON.parse(event.metadata) : event.metadata;
      const geoData = extractCountryFromIP(metadata);
      const threatType = determineThreatType(event.description, event.severity);

      return {
        id: event.id,
        country: geoData.country,
        countryCode: geoData.code,
        threatType,
        severity: event.severity || "MEDIUM",
        description: event.description,
        ipAddress: metadata.ip_address || "Unknown",
        timestamp: event.created_at,
        details: metadata.details || event.description,
      };
    });
  } catch (error) {
    console.error("Error fetching threat incidents:", error);
    throw new Error("Failed to fetch threat incidents");
  }
}

/**
 * Get threat timeline for heatmap
 */
export async function fetchThreatTimeline(
  filters: ThreatFilterOptions = {}
): Promise<Array<{ date: string; threats: number }>> {
  try {
    let query = supabase.from("security_events").select("created_at");

    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by date
    const timelineMap = new Map<string, number>();
    (data || []).forEach((event: any) => {
      const date = new Date(event.created_at).toISOString().split("T")[0];
      timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
    });

    return Array.from(timelineMap.entries())
      .map(([date, threats]) => ({ date, threats }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error("Error fetching threat timeline:", error);
    throw new Error("Failed to fetch threat timeline");
  }
}

/**
 * Subscribe to real-time threat updates
 */
export function subscribeToThreatUpdates(
  callback: (event: ThreatIncident) => void
): () => void {
  const subscription = supabase
    .channel("security_events:changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "security_events",
      },
      (payload: any) => {
        const event = payload.new as any;
        const metadata = typeof event.metadata === "string" ? JSON.parse(event.metadata) : event.metadata;
        const geoData = extractCountryFromIP(metadata);
        const threatType = determineThreatType(event.description, event.severity);

        callback({
          id: event.id,
          country: geoData.country,
          countryCode: geoData.code,
          threatType,
          severity: event.severity || "MEDIUM",
          description: event.description,
          ipAddress: metadata.ip_address || "Unknown",
          timestamp: event.created_at,
          details: metadata.details || event.description,
        });
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
