export type LocationType = "google-maps" | "meet" | "zoom" | "webex" | "other";

export interface DetectedLocation {
  type: LocationType;
  url: string;
  label: string;
}

/**
 * Detecta el tipo de enlace ingresado
 * @param url - URL a detectar
 * @returns LocationType
 */
export function detectLinkType(url: string): LocationType {
  const normalizedUrl = url.toLowerCase().trim();

  // Google Maps
  if (
    normalizedUrl.includes("maps.google.com") ||
    normalizedUrl.includes("google.com/maps") ||
    normalizedUrl.includes("goo.gl/maps") ||
    normalizedUrl.includes("maps.app.goo.gl")
  ) {
    return "google-maps";
  }

  // Google Meet
  if (
    normalizedUrl.includes("meet.google.com") ||
    normalizedUrl.includes("g.co/meet")
  ) {
    return "meet";
  }

  // Zoom
  if (normalizedUrl.includes("zoom.us") || normalizedUrl.includes("zoom.com")) {
    return "zoom";
  }

  // Cisco Webex
  if (
    normalizedUrl.includes("webex.com") ||
    normalizedUrl.includes("webex.us")
  ) {
    return "webex";
  }

  return "other";
}

/**
 * Obtiene la etiqueta descriptiva según el tipo de ubicación
 */
export function getLocationTypeLabel(type: LocationType): string {
  const labels: Record<LocationType, string> = {
    "google-maps": "📍 Google Maps",
    meet: "🎥 Google Meet",
    zoom: "🎥 Zoom",
    webex: "🎥 Cisco Webex",
    other: "🔗 Enlace personalizado",
  };

  return labels[type];
}

/**
 * Valida si una URL es válida
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    // Intenta agregar https:// si no tiene protocolo
    try {
      new URL(`https://${url}`);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Normaliza la URL agregando protocolo si es necesario
 */
export function normalizeUrl(url: string): string {
  const trimmedUrl = url.trim();

  if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
    return `https://${trimmedUrl}`;
  }

  return trimmedUrl;
}
