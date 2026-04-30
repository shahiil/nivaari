"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import mapboxgl from "mapbox-gl";
import { useAuth } from "@/contexts/AuthContext";
import { ImageUpload } from "@/components/ImageUpload";
import toast from "react-hot-toast";
import "mapbox-gl/dist/mapbox-gl.css";

type ZoneKey =
  | "commercial"
  | "agriculture"
  | "educational"
  | "residential"
  | "industrial"
  | "health"
  | "railway_station"
  | "food"
  | "hotel"
  | "entertainment";

type ZoneOption = "all" | ZoneKey;
type LngLatTuple = [number, number];
type ResultSource = "mapbox" | "osm" | "hybrid";
type PrecisionType = "exact" | "approximate";

type SearchIntent = {
  normalizedQuery: string;
  terms: string[];
  nearMe: boolean;
  best: boolean;
  openNow: boolean;
  locationPhrase?: string;
};

type UniversalSuggestion = {
  id: string;
  name: string;
  fullName: string;
  center: LngLatTuple;
  typeLabel: string;
  distanceKm: number;
  relevance: number;
  importance: number;
  confidence: number;
  precision: PrecisionType;
  confidenceLabel: string;
  approximateReason?: string;
  source: ResultSource;
  thumbnailUrl?: string;
  searchedAt?: number;
};

type MapboxFeature = {
  id?: string;
  text?: string;
  place_name?: string;
  center?: [number, number];
  relevance?: number;
  place_type?: string[];
  properties?: Record<string, unknown>;
};

type OSMFeature = {
  place_id?: number;
  osm_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
  importance?: number;
  name?: string;
};

const ZONE_CONFIG: Array<{
  key: ZoneKey;
  label: string;
  buildingKeywords: string[];
  poiKeywords: string[];
  color: string;
}> = [
  {
    key: "commercial",
    label: "Commercial",
    buildingKeywords: [
      "commercial",
      "retail",
      "office",
      "business",
      "mall",
      "store",
      "shop",
      "supermarket",
      "marketplace",
      "bank",
      "atm",
      "showroom",
    ],
    poiKeywords: ["commercial", "retail", "shop", "office", "mall", "store", "business", "market", "bank", "atm"],
    color: "#2563eb",
  },
  {
    key: "agriculture",
    label: "Agriculture",
    buildingKeywords: ["farm", "farmland", "agricultural", "greenhouse", "barn", "agri", "farm_auxiliary", "stable"],
    poiKeywords: ["farm", "farmland", "agriculture", "agri", "greenhouse", "barn", "stable"],
    color: "#facc15",
  },
  {
    key: "educational",
    label: "Educational",
    buildingKeywords: [
      "school",
      "college",
      "university",
      "kindergarten",
      "education",
      "library",
      "campus",
      "institute",
      "academy",
      "hostel",
      "dormitory",
    ],
    poiKeywords: ["school", "college", "university", "kindergarten", "education", "library", "campus", "institute", "academy"],
    color: "#92400e",
  },
  {
    key: "residential",
    label: "Residential",
    buildingKeywords: [
      "residential",
      "apartment",
      "apartments",
      "house",
      "detached",
      "semidetached_house",
      "terrace",
      "bungalow",
      "housing",
      "home",
      "villa",
      "residence",
      "dormitory",
      "yes",
      "building",
    ],
    poiKeywords: ["residential", "housing", "apartment", "home", "residence", "neighborhood", "society"],
    color: "#22c55e",
  },
  {
    key: "industrial",
    label: "Industrial",
    buildingKeywords: ["industrial", "factory", "manufacture", "manufacturing", "warehouse", "plant", "workshop", "depot", "works"],
    poiKeywords: ["industrial", "factory", "warehouse", "plant", "workshop", "depot", "works"],
    color: "#111827",
  },
  {
    key: "health",
    label: "Health",
    buildingKeywords: [
      "hospital",
      "clinic",
      "doctors",
      "doctor",
      "healthcare",
      "medical",
      "emergency",
      "pharmacy",
      "nursing",
      "dispensary",
    ],
    poiKeywords: ["hospital", "clinic", "doctor", "health", "medical", "pharmacy", "emergency", "nursing", "dispensary"],
    color: "#dc2626",
  },
  {
    key: "railway_station",
    label: "Railway Station",
    buildingKeywords: ["railway", "station", "train", "platform", "rail", "transit", "metro", "subway"],
    poiKeywords: ["railway", "train", "station", "platform", "transit", "train_station", "metro", "subway"],
    color: "#8b5cf6",
  },
  {
    key: "food",
    label: "Food",
    buildingKeywords: [
      "food",
      "restaurant",
      "fast_food",
      "cafe",
      "coffee",
      "bar",
      "pub",
      "eatery",
      "bakery",
      "canteen",
      "pizza",
      "burger",
      "domino",
      "dominos",
      "domino's",
      "mcdonald",
      "mcdonalds",
      "mc donald",
      "starbucks",
      "kfc",
      "subway",
    ],
    poiKeywords: [
      "food_and_drink",
      "restaurant",
      "fast_food",
      "cafe",
      "coffee",
      "bakery",
      "bar",
      "pub",
      "canteen",
      "pizza",
      "burger",
      "domino",
      "dominos",
      "domino's",
      "mcdonald",
      "mcdonalds",
      "mc donald",
      "starbucks",
      "kfc",
      "subway",
    ],
    color: "#f97316",
  },
  {
    key: "hotel",
    label: "Hotel",
    buildingKeywords: ["hotel", "hostel", "guest_house", "guesthouse", "motel", "resort", "lodging", "lodge", "inn"],
    poiKeywords: ["hotel", "hostel", "guest_house", "guesthouse", "motel", "resort", "lodging", "lodge", "inn"],
    color: "#3b82f6",
  },
  {
    key: "entertainment",
    label: "Entertainment",
    buildingKeywords: ["entertainment", "cinema", "theatre", "theater", "stadium", "museum", "park", "arts_centre", "auditorium"],
    poiKeywords: ["entertainment", "cinema", "theatre", "theater", "stadium", "museum", "park", "attraction", "auditorium"],
    color: "#ec4899",
  },
];

const BUILDING_LAYER_ID = "3d-buildings";
const ZONE_POI_LABEL_LAYER_ID = "zone-poi-labels";
const HIGHWAY_3D_LAYER_ID = "3d-highways";
const RAILWAY_3D_LAYER_ID = "3d-railways";
const RADIUS_SOURCE_ID = "zone-radius-source";
const RADIUS_FILL_LAYER_ID = "zone-radius-fill";
const RADIUS_OUTLINE_LAYER_ID = "zone-radius-outline";
const CLASSIFIED_BUILDINGS_SOURCE_ID = "classified-buildings-source";
const CLASSIFIED_BUILDINGS_LAYER_ID = "classified-buildings-layer";
const SELECTED_PLACE_SOURCE_ID = "selected-place-source";
const SELECTED_PLACE_FILL_LAYER_ID = "selected-place-fill";
const SELECTED_PLACE_LINE_LAYER_ID = "selected-place-line";
const POI_CATEGORIZED_BUILDING_SOURCE_ID = "poi-categorized-building-source";
const POI_CATEGORIZED_BUILDING_LAYER_ID = "poi-categorized-buildings";
const REPORT_IMPACT_SOURCE_ID = "report-impact-source";
const REPORT_IMPACT_FILL_LAYER_ID = "report-impact-fill";
const REPORT_IMPACT_OUTLINE_LAYER_ID = "report-impact-outline";
const DEFAULT_MAP_PITCH = 60;
const DEFAULT_MAP_BEARING = -17.6;
const MIN_3D_ZOOM = 14;
const STREETS_STYLE = "mapbox://styles/mapbox/streets-v12";
const SATELLITE_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";
const MAP_STYLE_LABELS = {
  streets: "Civic",
  satellite: "Satellite",
} as const;
const DEFAULT_RADIUS_KM = 0.2;
const RADIUS_VISIBILITY_MIN_ZOOM = 9;
const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_CACHE_TTL_MS = 4 * 60 * 1000;
const RECENT_SEARCHES_KEY = "nivaari-recent-searches-v2";
const MAX_RECENT_SEARCHES = 8;
const MIN_CONFIDENCE_DEFAULT = 0.45;
const SERVICE_BUILDING_KEYWORDS = [
  "service",
  "shop",
  "store",
  "market",
  "office",
  "mall",
  "hospital",
  "clinic",
  "school",
  "college",
  "university",
  "restaurant",
  "cafe",
  "hotel",
  "station",
  "bank",
  "pharmacy",
  "warehouse",
  "factory",
];
const RESIDENTIAL_EXCLUDE_KEYWORDS = ["residential", "apartment", "house", "housing", "home", "villa"];
const BUILDING_CLASSIFICATION_MAX_FEATURES = 650;
const POI_TO_BUILDING_MATCH_KM = 0.16;

type ReportType = "potholes" | "garbage" | "flooding" | "streetlight" | "traffic" | "water" | "danger" | "trees" | "other";

type ReportItem = {
  id: string;
  title: string;
  type: ReportType;
  description?: string;
  location?: { lat?: number; lng?: number; address?: string };
  impactRadiusKm?: number;
  createdAt?: string;
  aiSummary?: string;
  createdBySocialId?: string;
  upvotes?: number;
  downvotes?: number;
  myVote?: "upvote" | "downvote";
};

type ReportChatMessage = { role: "user" | "assistant"; text: string };

type ReportDraft = {
  title?: string;
  type?: ReportType;
  description?: string;
  location?: { lat?: number; lng?: number; address?: string };
  impactRadiusKm?: number;
  verificationQuestions?: string[];
};

const REPORT_TYPE_META: Record<ReportType, { icon: string; color: string; label: string }> = {
  potholes: { icon: "🕳️", color: "#ea580c", label: "Pothole" },
  garbage: { icon: "🗑️", color: "#16a34a", label: "Garbage" },
  flooding: { icon: "🌊", color: "#0284c7", label: "Flooding" },
  streetlight: { icon: "💡", color: "#f59e0b", label: "Streetlight" },
  traffic: { icon: "🚦", color: "#dc2626", label: "Traffic" },
  water: { icon: "💧", color: "#0891b2", label: "Water" },
  danger: { icon: "⚠️", color: "#b91c1c", label: "Danger" },
  trees: { icon: "🌳", color: "#059669", label: "Trees" },
  other: { icon: "📍", color: "#64748b", label: "Other" },
};

const normalizeReportType = (input?: string): ReportType => {
  const value = String(input ?? "").trim().toLowerCase();
  if (/(pothole|road damage|crack)/.test(value)) return "potholes";
  if (/(garbage|trash|waste|dustbin)/.test(value)) return "garbage";
  if (/(flood|water log|drain)/.test(value)) return "flooding";
  if (/(streetlight|light)/.test(value)) return "streetlight";
  if (/(traffic|jam|signal)/.test(value)) return "traffic";
  if (/(water|pipeline|supply)/.test(value)) return "water";
  if (/(tree|fallen tree)/.test(value)) return "trees";
  if (/(danger|accident|hazard|unsafe)/.test(value)) return "danger";
  if (value in REPORT_TYPE_META) return value as ReportType;
  return "other";
};

const getReportMeta = (type?: string) => REPORT_TYPE_META[normalizeReportType(type)] ?? REPORT_TYPE_META.other;
const getReportMarkerLabel = (type?: string) => {
  const normalized = normalizeReportType(type);
  if (normalized === "potholes" || normalized === "danger") return "!";
  if (normalized === "trees") return "TR";
  return getReportMeta(normalized).label.slice(0, 1).toUpperCase();
};

const QUICK_REPORT_TYPES: ReportType[] = ["potholes", "garbage", "flooding", "streetlight", "traffic", "danger"];

const buildReportImpactFeatureCollection = (reports: ReportItem[]): GeoJSON.FeatureCollection => {
  const impactFeatures = reports.flatMap((report) => {
    const lat = report.location?.lat;
    const lng = report.location?.lng;
    const radiusKm = report.impactRadiusKm;
    if (typeof lat !== "number" || typeof lng !== "number" || typeof radiusKm !== "number" || radiusKm <= 0) {
      return [];
    }

    const meta = getReportMeta(report.type);
    return buildRadiusFeature([lng, lat], clamp(radiusKm, 0.05, 5), 80, {
      reportId: report.id,
      radiusColor: meta.color,
      radiusOpacity: 0.14,
    }).features;
  });

  return {
    type: "FeatureCollection",
    features: impactFeatures,
  };
};

const ensureReportImpactLayers = (map: mapboxgl.Map, reports: ReportItem[]) => {
  const data = buildReportImpactFeatureCollection(reports);

  let source = map.getSource(REPORT_IMPACT_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (!source) {
    map.addSource(REPORT_IMPACT_SOURCE_ID, { type: "geojson", data });
    source = map.getSource(REPORT_IMPACT_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  } else {
    source.setData(data);
  }

  if (!map.getLayer(REPORT_IMPACT_FILL_LAYER_ID)) {
    map.addLayer({
      id: REPORT_IMPACT_FILL_LAYER_ID,
      type: "fill",
      source: REPORT_IMPACT_SOURCE_ID,
      paint: {
        "fill-color": ["coalesce", ["get", "radiusColor"], "#22d3ee"],
        "fill-opacity": ["coalesce", ["get", "radiusOpacity"], 0.12],
      },
    });
  }

  if (!map.getLayer(REPORT_IMPACT_OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: REPORT_IMPACT_OUTLINE_LAYER_ID,
      type: "line",
      source: REPORT_IMPACT_SOURCE_ID,
      paint: {
        "line-color": ["coalesce", ["get", "radiusColor"], "#22d3ee"],
        "line-opacity": 0.9,
        "line-width": 1.5,
      },
    });
  }
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const calculateDistance = (lng1: number, lat1: number, lng2: number, lat2: number): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
};

const detectTypeLabel = (name: string, fullName: string): string => {
  const text = normalizeText(`${name} ${fullName}`);

  if (/\b(school|college|university|institute|academy|campus)\b/.test(text)) return "Education";
  if (/\b(apartment|society|residential|tower|housing|residence|villa)\b/.test(text)) return "Residential";
  if (/\b(office|company|corporate|business|park)\b/.test(text)) return "Office / Institution";
  if (/\b(hospital|clinic|medical)\b/.test(text)) return "Healthcare";
  if (/\b(railway|station|metro|bus)\b/.test(text)) return "Transport";
  if (/\b(road|street|lane|marg|nagar|city|area|locality|address)\b/.test(text)) return "Address / Area";
  if (/\b(monument|landmark|museum|park|bridge|temple|church|mosque)\b/.test(text)) return "Landmark";
  if (/\b(shop|store|market|service|mall)\b/.test(text)) return "Shop / Service";

  return "Place";
};

const getZoneConfig = (zone: ZoneOption) => ZONE_CONFIG.find((item) => item.key === zone);

const getZoneSearchText = (properties: Record<string, unknown> | null | undefined) =>
  normalizeText(
    [
      properties?.class,
      properties?.type,
      properties?.subclass,
      properties?.category,
      properties?.maki,
      properties?.name,
      properties?.name_en,
      properties?.brand,
      properties?.operator,
    ]
      .filter(Boolean)
      .join(" "),
  );

const classifyZoneFromText = (text: string): ZoneKey | null => {
  if (!text) return null;

  const priority: ZoneKey[] = [
    "health",
    "educational",
    "industrial",
    "agriculture",
    "food",
    "railway_station",
    "hotel",
    "entertainment",
    "commercial",
    "residential",
  ];

  return (
    priority.find((zoneKey) => {
      const config = getZoneConfig(zoneKey);
      const keywords = [...(config?.buildingKeywords ?? []), ...(config?.poiKeywords ?? [])];
      return keywords.some((keyword) => text.includes(normalizeText(keyword)));
    }) ?? null
  );
};

const getPointFromGeometry = (geometry: GeoJSON.Geometry | null | undefined): LngLatTuple | null => {
  if (!geometry) return null;
  if (geometry.type === "Point") return geometry.coordinates as LngLatTuple;
  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") return deriveBuildingCenter(geometry);
  return null;
};

const buildStaticPreviewImage = (center: LngLatTuple, token: string) =>
  token
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+2563eb(${center[0]},${center[1]})/${center[0]},${center[1]},15/280x160?access_token=${token}`
    : undefined;

const getBuildingSearchTextExpression = (): mapboxgl.ExpressionSpecification =>
  [
    "downcase",
    [
      "concat",
      ["coalesce", ["get", "class"], ""],
      " ",
      ["coalesce", ["get", "type"], ""],
      " ",
      ["coalesce", ["get", "building"], ""],
      " ",
      ["coalesce", ["get", "building:type"], ""],
      " ",
      ["coalesce", ["get", "amenity"], ""],
      " ",
      ["coalesce", ["get", "landuse"], ""],
      " ",
      ["coalesce", ["get", "subclass"], ""],
      " ",
      ["coalesce", ["get", "category"], ""],
      " ",
      ["coalesce", ["get", "name"], ""],
      " ",
      ["coalesce", ["get", "name_en"], ""],
    ],
  ] as mapboxgl.ExpressionSpecification;

const getPoiSearchTextExpression = (): mapboxgl.ExpressionSpecification =>
  [
    "downcase",
    [
      "concat",
      ["coalesce", ["get", "class"], ""],
      " ",
      ["coalesce", ["get", "type"], ""],
      " ",
      ["coalesce", ["get", "subclass"], ""],
      " ",
      ["coalesce", ["get", "category"], ""],
      " ",
      ["coalesce", ["get", "maki"], ""],
      " ",
      ["coalesce", ["get", "name"], ""],
    ],
  ] as mapboxgl.ExpressionSpecification;

const buildKeywordMatchExpression = (
  searchExpression: mapboxgl.ExpressionSpecification,
  keywords: string[],
): mapboxgl.ExpressionSpecification => {
  const conditions = keywords.map(
    (keyword) => ["!=", ["index-of", keyword, searchExpression], -1] as mapboxgl.ExpressionSpecification,
  );

  if (conditions.length === 0) {
    return ["==", ["literal", 1], ["literal", 0]] as mapboxgl.ExpressionSpecification;
  }

  return ["any", ...conditions] as mapboxgl.ExpressionSpecification;
};

const getZoneByKey = (key: ZoneKey) => ZONE_CONFIG.find((zone) => zone.key === key);

const CATEGORY_PRIORITY: ZoneKey[] = [
  "health",
  "educational",
  "railway_station",
  "food",
  "hotel",
  "entertainment",
  "industrial",
  "agriculture",
  "commercial",
  "residential",
];

const buildBuildingCategoryColorExpression = (): mapboxgl.ExpressionSpecification => {
  const searchExpression = getBuildingSearchTextExpression();

  const cases = CATEGORY_PRIORITY.flatMap((zoneKey) => {
    const zone = getZoneByKey(zoneKey);
    if (!zone) return [];
    return [buildKeywordMatchExpression(searchExpression, zone.buildingKeywords), zone.color];
  });

  return ["case", ...cases, getZoneByKey("residential")?.color ?? "#22c55e"] as mapboxgl.ExpressionSpecification;
};

const getFeatureText = (properties: Record<string, unknown> | null | undefined, keys: string[]): string =>
  normalizeText(keys.map((key) => String(properties?.[key] ?? "")).join(" "));

const getPoiText = (properties: Record<string, unknown> | null | undefined): string =>
  getFeatureText(properties, ["class", "type", "subclass", "category", "maki", "name", "name_en", "brand"]);

const detectPoiZone = (properties: Record<string, unknown> | null | undefined): ZoneKey | null => {
  const text = getPoiText(properties);
  if (!text) return null;

  for (const zoneKey of CATEGORY_PRIORITY) {
    const zone = getZoneByKey(zoneKey);
    if (!zone) continue;
    if (zone.poiKeywords.some((keyword) => text.includes(normalizeText(keyword)))) return zoneKey;
  }

  return null;
};

const buildPoiCategoryFilterExpression = (selectedZone: ZoneOption): mapboxgl.FilterSpecification => {
  if (selectedZone !== "all") return buildPoiLabelFilterExpression(selectedZone);

  const allPoiKeywords = Array.from(new Set(ZONE_CONFIG.flatMap((zone) => zone.poiKeywords)));
  return buildKeywordMatchExpression(getPoiSearchTextExpression(), allPoiKeywords) as mapboxgl.FilterSpecification;
};

const buildRadiusFeature = (
  center: LngLatTuple,
  radiusKm: number,
  steps = 96,
  properties: Record<string, unknown> = {},
): GeoJSON.FeatureCollection => {
  const [lng, lat] = center;
  const earthRadiusKm = 6371;
  const angularDistance = radiusKm / earthRadiusKm;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const coordinates: Array<[number, number]> = [];

  for (let i = 0; i <= steps; i += 1) {
    const bearing = (2 * Math.PI * i) / steps;
    const lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(angularDistance) +
        Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const lng2 =
      lngRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
        Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(lat2),
      );

    coordinates.push([((lng2 * 180) / Math.PI + 540) % 360 - 180, (lat2 * 180) / Math.PI]);
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties,
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
      },
    ],
  };
};

const emptyFeatureCollection = (): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: [],
});

const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const collectPolygonVertices = (geometry: GeoJSON.Geometry): Array<[number, number]> => {
  if (geometry.type === "Polygon") {
    return geometry.coordinates[0] as Array<[number, number]>;
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap((polygon) => polygon[0] as Array<[number, number]>);
  }

  return [];
};

const deriveBuildingCenter = (geometry: GeoJSON.Geometry): LngLatTuple | null => {
  const vertices = collectPolygonVertices(geometry);
  if (vertices.length === 0) return null;

  const sums = vertices.reduce(
    (acc, [lng, lat]) => {
      acc.lng += lng;
      acc.lat += lat;
      return acc;
    },
    { lng: 0, lat: 0 },
  );

  return [sums.lng / vertices.length, sums.lat / vertices.length];
};

const pointInRing = (point: LngLatTuple, ring: Array<[number, number]>): boolean => {
  const [lng, lat] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [lngI, latI] = ring[i];
    const [lngJ, latJ] = ring[j];
    const intersects = latI > lat !== latJ > lat && lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;
    if (intersects) inside = !inside;
  }

  return inside;
};

const pointInBuildingGeometry = (point: LngLatTuple, geometry: GeoJSON.Geometry): boolean => {
  if (geometry.type === "Polygon") {
    const [outerRing, ...holes] = geometry.coordinates as Array<Array<[number, number]>>;
    return pointInRing(point, outerRing) && !holes.some((hole) => pointInRing(point, hole));
  }

  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as Array<Array<Array<[number, number]>>>).some(([outerRing, ...holes]) => {
      return pointInRing(point, outerRing) && !holes.some((hole) => pointInRing(point, hole));
    });
  }

  return false;
};

const derivePointFeatureCenter = (geometry: GeoJSON.Geometry | null | undefined): LngLatTuple | null => {
  if (!geometry || geometry.type !== "Point") return null;
  const [lng, lat] = geometry.coordinates;
  return [lng, lat];
};

const deriveBuildingRadiusKm = (
  geometry: GeoJSON.Geometry,
  center: LngLatTuple,
  properties: Record<string, unknown> | null | undefined,
  fallbackRadiusKm: number,
): number => {
  const vertices = collectPolygonVertices(geometry);
  const footprintKm = vertices.reduce((maxDistance, [lng, lat]) => {
    const distance = calculateDistance(center[0], center[1], lng, lat);
    return Math.max(maxDistance, distance);
  }, 0);

  const heightValue =
    parseNumericValue(properties?.height) ??
    parseNumericValue(properties?.render_height) ??
    (parseNumericValue(properties?.levels) ?? 0) * 3;

  const heightKm = clamp(heightValue / 1000, 0, 0.25);
  const adaptiveRadiusKm = footprintKm * 1.8 + heightKm * 0.34 + fallbackRadiusKm * 0.35;

  return clamp(adaptiveRadiusKm || fallbackRadiusKm, 0.1, 0.9);
};

type RadiusCircle = {
  center: LngLatTuple;
  radiusKm: number;
};

const circlesOverlap = (first: RadiusCircle, second: RadiusCircle): boolean => {
  const centerDistanceKm = calculateDistance(first.center[0], first.center[1], second.center[0], second.center[1]);
  const mergeBufferKm = 0.06;
  return centerDistanceKm <= first.radiusKm + second.radiusKm + mergeBufferKm;
};

const mergeOverlappingCircles = (circles: RadiusCircle[]): RadiusCircle[] => {
  if (circles.length <= 1) return circles;

  const visited = new Array(circles.length).fill(false);
  const merged: RadiusCircle[] = [];

  for (let index = 0; index < circles.length; index += 1) {
    if (visited[index]) continue;

    const stack = [index];
    const cluster: RadiusCircle[] = [];
    visited[index] = true;

    while (stack.length > 0) {
      const currentIndex = stack.pop()!;
      const current = circles[currentIndex];
      cluster.push(current);

      for (let candidateIndex = 0; candidateIndex < circles.length; candidateIndex += 1) {
        if (visited[candidateIndex]) continue;
        if (!circlesOverlap(current, circles[candidateIndex])) continue;
        visited[candidateIndex] = true;
        stack.push(candidateIndex);
      }
    }

    const weighted = cluster.reduce(
      (acc, item) => {
        const weight = Math.max(item.radiusKm, 0.02);
        acc.lng += item.center[0] * weight;
        acc.lat += item.center[1] * weight;
        acc.weight += weight;
        return acc;
      },
      { lng: 0, lat: 0, weight: 0 },
    );

    const mergedCenter: LngLatTuple = [weighted.lng / weighted.weight, weighted.lat / weighted.weight];
    const mergedRadiusKm = cluster.reduce((maxRadius, item) => {
      const distanceToMergedCenter = calculateDistance(
        mergedCenter[0],
        mergedCenter[1],
        item.center[0],
        item.center[1],
      );
      return Math.max(maxRadius, distanceToMergedCenter + item.radiusKm);
    }, 0);

    const clusterBoost = 1 + Math.min(0.4, (cluster.length - 1) * 0.08);

    merged.push({
      center: mergedCenter,
      radiusKm: clamp(mergedRadiusKm * clusterBoost, 0.1, 1.2),
    });
  }

  return merged;
};

type ClassifiedPoi = {
  center: LngLatTuple;
  zone: ZoneKey;
  confidence: number;
};

const collectClassifiedPois = (map: mapboxgl.Map): ClassifiedPoi[] => {
  const poiFeatures = map.querySourceFeatures("composite", { sourceLayer: "poi_label" });

  return poiFeatures.flatMap((feature) => {
    const center = getPointFromGeometry(feature.geometry as GeoJSON.Geometry | null);
    if (!center) return [];

    const properties = (feature.properties as Record<string, unknown>) ?? {};
    const zone = classifyZoneFromText(getZoneSearchText(properties));
    if (!zone) return [];

    const confidence = Number(properties?.filterrank ?? properties?.sizerank ?? 8);
    return [{ center, zone, confidence: Number.isFinite(confidence) ? confidence : 8 }];
  });
};

const findNearestClassifiedPoiZone = (center: LngLatTuple, pois: ClassifiedPoi[]): ZoneKey | null => {
  let nearest: { zone: ZoneKey; score: number } | null = null;

  pois.forEach((poi) => {
    const distanceKm = calculateDistance(center[0], center[1], poi.center[0], poi.center[1]);
    if (distanceKm > POI_TO_BUILDING_MATCH_KM) return;
    const score = distanceKm + poi.confidence * 0.002;
    if (!nearest || score < nearest.score) nearest = { zone: poi.zone, score };
  });

  return nearest?.zone ?? null;
};

const buildClassifiedBuildingFeatureCollection = (
  map: mapboxgl.Map,
  selectedZone: ZoneOption,
): GeoJSON.FeatureCollection => {
  const buildingFeatures = map.querySourceFeatures("composite", {
    sourceLayer: "building",
    filter: buildZoneFilterExpression("all"),
  });
  const pois = collectClassifiedPois(map);
  const dedupe = new Set<string>();
  const features: GeoJSON.Feature[] = [];

  for (const feature of buildingFeatures) {
    if (features.length >= BUILDING_CLASSIFICATION_MAX_FEATURES) break;

    const geometry = feature.geometry as GeoJSON.Geometry | null;
    if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) continue;

    const center = deriveBuildingCenter(geometry);
    if (!center) continue;

    const dedupeKey = `${center[0].toFixed(6)}:${center[1].toFixed(6)}`;
    if (dedupe.has(dedupeKey)) continue;
    dedupe.add(dedupeKey);

    const properties = (feature.properties as Record<string, unknown>) ?? {};
    const directZone = classifyZoneFromText(getZoneSearchText(properties));
    const zone = directZone ?? findNearestClassifiedPoiZone(center, pois) ?? "residential";
    if (selectedZone !== "all" && zone !== selectedZone) continue;

    const config = getZoneConfig(zone);
    features.push({
      type: "Feature",
      geometry,
      properties: {
        zone,
        zoneLabel: config?.label ?? "Residential",
        zoneColor: config?.color ?? "#22c55e",
        height: parseNumericValue(properties.height) ?? parseNumericValue(properties.render_height) ?? 18,
        minHeight: parseNumericValue(properties.min_height) ?? 0,
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
};

const buildGradientRadiusFeatures = (
  circles: RadiusCircle[],
  zoneColor: string,
  gradientSteps = 14,
): GeoJSON.Feature[] => {
  const features: GeoJSON.Feature[] = [];

  circles.forEach((circle, clusterIndex) => {
    for (let step = gradientSteps; step >= 1; step -= 1) {
      const stepRatio = step / gradientSteps;
      const eased = 1 - stepRatio;
      const gradientOpacity = clamp(0.025 + Math.pow(eased, 1.6) * 0.36, 0.025, 0.4);
      const ringRadiusKm = circle.radiusKm * stepRatio;
      const gradientOrder = gradientSteps - step;

      features.push(
        ...buildRadiusFeature(circle.center, ringRadiusKm, 96, {
          radiusColor: zoneColor,
          radiusOpacity: gradientOpacity,
          boundaryOpacity: step === gradientSteps ? 1 : 0,
          gradientOrder,
          clusterIndex,
        }).features,
      );
    }
  });

  return features;
};

const buildZoneRadiusFeatureCollection = (
  map: mapboxgl.Map,
  selectedZone: ZoneOption,
  fallbackRadiusKm: number,
): GeoJSON.FeatureCollection => {
  if (selectedZone === "all") return emptyFeatureCollection();

  if (selectedZone === "residential") return emptyFeatureCollection();

  const buildingSearchTextExpression = getBuildingSearchTextExpression();

  const features = map.querySourceFeatures("composite", {
    sourceLayer: "building",
    filter: [
      "all",
      buildZoneFilterExpression(selectedZone),
      buildKeywordMatchExpression(buildingSearchTextExpression, SERVICE_BUILDING_KEYWORDS),
      ["!", buildKeywordMatchExpression(buildingSearchTextExpression, RESIDENTIAL_EXCLUDE_KEYWORDS)],
    ] as mapboxgl.FilterSpecification,
  });
  const zoneColor = ZONE_CONFIG.find((zone) => zone.key === selectedZone)?.color ?? "#22d3ee";

  if (features.length === 0) return emptyFeatureCollection();

  const dedupe = new Set<string>();
  const baseCircles: RadiusCircle[] = features.flatMap((feature) => {
    const geometry = feature.geometry as GeoJSON.Geometry | null;
    if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) return [];

    const center = deriveBuildingCenter(geometry);
    if (!center) return [];

    const dedupeKey = `${center[0].toFixed(6)}:${center[1].toFixed(6)}`;
    if (dedupe.has(dedupeKey)) return [];
    dedupe.add(dedupeKey);

    const radiusForBuilding = deriveBuildingRadiusKm(
      geometry,
      center,
      (feature.properties as Record<string, unknown>) ?? null,
      fallbackRadiusKm,
    );

    return [{ center, radiusKm: radiusForBuilding }];
  });

  const mergedCircles = mergeOverlappingCircles(baseCircles);
  const circleFeatures = buildGradientRadiusFeatures(mergedCircles, zoneColor);

  return {
    type: "FeatureCollection",
    features: circleFeatures,
  };
};

const buildZoneFilterExpression = (selectedZone: ZoneOption): mapboxgl.FilterSpecification => {
  const baseExtrudeExpression: mapboxgl.ExpressionSpecification = [
    "any",
    ["==", ["get", "extrude"], "true"],
    [">", ["coalesce", ["get", "height"], ["get", "render_height"], 0], 0],
  ];

  if (selectedZone === "all") return baseExtrudeExpression as mapboxgl.FilterSpecification;

  const keywords = ZONE_CONFIG.find((zone) => zone.key === selectedZone)?.buildingKeywords ?? [];
  return [
    "all",
    baseExtrudeExpression,
    buildKeywordMatchExpression(getBuildingSearchTextExpression(), keywords),
  ] as mapboxgl.FilterSpecification;
};

const buildPoiLabelFilterExpression = (selectedZone: ZoneOption): mapboxgl.FilterSpecification => {
  if (selectedZone === "all") return ["==", ["literal", 1], ["literal", 0]] as mapboxgl.FilterSpecification;

  const keywords = ZONE_CONFIG.find((zone) => zone.key === selectedZone)?.poiKeywords ?? [];
  return ["all", buildKeywordMatchExpression(getPoiSearchTextExpression(), keywords)] as mapboxgl.FilterSpecification;
};

const findBuildingForPoi = (
  poiCenter: LngLatTuple,
  buildings: mapboxgl.MapboxGeoJSONFeature[],
): mapboxgl.MapboxGeoJSONFeature | null => {
  let nearest: { feature: mapboxgl.MapboxGeoJSONFeature; distanceKm: number } | null = null;

  for (const building of buildings) {
    const geometry = building.geometry as GeoJSON.Geometry | null;
    if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) continue;

    if (pointInBuildingGeometry(poiCenter, geometry)) return building;

    const center = deriveBuildingCenter(geometry);
    if (!center) continue;

    const distanceKm = calculateDistance(poiCenter[0], poiCenter[1], center[0], center[1]);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { feature: building, distanceKm };
    }
  }

  return nearest && nearest.distanceKm <= 0.045 ? nearest.feature : null;
};

const buildPoiCategorizedBuildingFeatureCollection = (
  map: mapboxgl.Map,
  selectedZone: ZoneOption,
): GeoJSON.FeatureCollection => {
  const buildings = map.querySourceFeatures("composite", {
    sourceLayer: "building",
    filter: buildZoneFilterExpression("all"),
  });
  if (buildings.length === 0) return emptyFeatureCollection();

  const pois = map.querySourceFeatures("composite", {
    sourceLayer: "poi_label",
    filter: buildPoiCategoryFilterExpression(selectedZone),
  });
  if (pois.length === 0) return emptyFeatureCollection();

  const dedupe = new Set<string>();
  const features: GeoJSON.Feature[] = [];

  pois.forEach((poi) => {
    const poiCenter = derivePointFeatureCenter(poi.geometry as GeoJSON.Geometry | null);
    if (!poiCenter) return;

    const zoneKey = detectPoiZone((poi.properties as Record<string, unknown>) ?? null);
    if (!zoneKey || (selectedZone !== "all" && zoneKey !== selectedZone)) return;

    const building = findBuildingForPoi(poiCenter, buildings);
    const buildingGeometry = building?.geometry as GeoJSON.Geometry | null;
    if (!building || !buildingGeometry) return;

    const buildingCenter = deriveBuildingCenter(buildingGeometry);
    const dedupeKey = `${zoneKey}:${building.id ?? ""}:${buildingCenter?.[0].toFixed(6) ?? poiCenter[0].toFixed(6)}:${buildingCenter?.[1].toFixed(6) ?? poiCenter[1].toFixed(6)}`;
    if (dedupe.has(dedupeKey)) return;
    dedupe.add(dedupeKey);

    const zone = getZoneByKey(zoneKey);
    const buildingProperties = (building.properties as Record<string, unknown>) ?? {};
    features.push({
      type: "Feature",
      geometry: buildingGeometry,
      properties: {
        ...buildingProperties,
        inferredZone: zoneKey,
        inferredZoneColor: zone?.color ?? "#22d3ee",
        inferredFromPoi: poi.properties?.name_en ?? poi.properties?.name ?? zone?.label,
      },
    });
  });

  return {
    type: "FeatureCollection",
    features,
  };
};

const updatePoiCategorizedBuildingLayer = (map: mapboxgl.Map, selectedZone: ZoneOption, labelLayerId?: string) => {
  const data = buildPoiCategorizedBuildingFeatureCollection(map, selectedZone);

  let source = map.getSource(POI_CATEGORIZED_BUILDING_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (!source) {
    map.addSource(POI_CATEGORIZED_BUILDING_SOURCE_ID, { type: "geojson", data });
    source = map.getSource(POI_CATEGORIZED_BUILDING_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  } else {
    source.setData(data);
  }

  if (map.getLayer(POI_CATEGORIZED_BUILDING_LAYER_ID)) return;

  map.addLayer(
    {
      id: POI_CATEGORIZED_BUILDING_LAYER_ID,
      source: POI_CATEGORIZED_BUILDING_SOURCE_ID,
      type: "fill-extrusion",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": ["coalesce", ["get", "inferredZoneColor"], "#22d3ee"],
        "fill-extrusion-height": ["+", ["coalesce", ["get", "height"], ["get", "render_height"], 10], 0.35],
        "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
        "fill-extrusion-opacity": 0.96,
      },
    },
    labelLayerId,
  );
};

const getLabelAnchorLayerId = (map: mapboxgl.Map): string | undefined =>
  map
    .getStyle()
    ?.layers?.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"])
    ?.id;

const ensureTransport3DLayers = (map: mapboxgl.Map) => {
  const labelLayerId = getLabelAnchorLayerId(map);

  if (!map.getLayer(HIGHWAY_3D_LAYER_ID)) {
    map.addLayer(
      {
        id: HIGHWAY_3D_LAYER_ID,
        type: "line",
        source: "composite",
        "source-layer": "road",
        filter: [
          "match",
          ["get", "class"],
          ["motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link"],
          true,
          false,
        ],
        minzoom: 9,
        layout: {
          "line-z-offset": ["interpolate", ["linear"], ["zoom"], 9, 0.15, 13, 0.35, 16, 0.7, 18, 1.2],
        },
        paint: {
          "line-color": [
            "match",
            ["get", "class"],
            ["motorway", "motorway_link"],
            "#f59e0b",
            ["trunk", "trunk_link"],
            "#fb7185",
            ["primary", "primary_link"],
            "#f97316",
            "#f59e0b",
          ],
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.5, 13, 3, 16, 6, 18, 10],
          "line-opacity": 0.95,
          "line-z-offset": ["interpolate", ["linear"], ["zoom"], 9, 0.15, 13, 0.35, 16, 0.7, 18, 1.2],
        } as any,
      } as any,
      labelLayerId,
    );
  }

  if (!map.getLayer(RAILWAY_3D_LAYER_ID)) {
    map.addLayer(
      {
        id: RAILWAY_3D_LAYER_ID,
        type: "line",
        source: "composite",
        "source-layer": "road",
        filter: ["match", ["get", "class"], ["rail", "transit"], true, false],
        minzoom: 8,
        layout: {
          "line-z-offset": ["interpolate", ["linear"], ["zoom"], 8, 0.1, 13, 0.25, 16, 0.5, 18, 0.9],
        },
        paint: {
          "line-color": "#a855f7",
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1, 13, 2.5, 16, 4.5, 18, 7],
          "line-opacity": 0.92,
        },
      } as mapboxgl.AnyLayer,
      labelLayerId,
    );
  }
};

const enableMapTerrain = (map: mapboxgl.Map) => {
  if (!map.getSource("mapbox-dem")) {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
  }

  map.setTerrain({ source: "mapbox-dem", exaggeration: 1.15 });
  if (!map.getLayer("sky")) {
    map.addLayer({
      id: "sky",
      type: "sky",
      paint: {
        "sky-type": "atmosphere",
        "sky-atmosphere-sun": [0, 0],
        "sky-atmosphere-sun-intensity": 7,
      },
    } as mapboxgl.AnyLayer);
  }
};

const disableMapTerrain = (map: mapboxgl.Map) => {
  map.setTerrain(null);
  if (map.getLayer("sky")) map.removeLayer("sky");
};

const applyMapTheme = (map: mapboxgl.Map) => {
  map.setFog({
    range: [0.7, 11.5],
    color: "hsl(217, 43%, 8%)",
    "high-color": "hsl(205, 55%, 12%)",
    "space-color": "hsl(223, 47%, 4%)",
    "horizon-blend": 0.14,
  });

  if (map.getLayer("background")) {
    map.setPaintProperty("background", "background-color", "#07111f");
  }

  if (map.getLayer("water")) {
    map.setPaintProperty("water", "fill-color", "#0c2239");
    map.setPaintProperty("water", "fill-opacity", 0.92);
  }

  if (map.getLayer("land")) {
    map.setPaintProperty("land", "fill-color", "#0d1628");
  }

  if (map.getLayer("landcover")) {
    map.setPaintProperty("landcover", "fill-color", "#0d1a2b");
    map.setPaintProperty("landcover", "fill-opacity", 0.5);
  }
};

const getBuildingColorExpression = (selectedZone: ZoneOption): mapboxgl.ExpressionSpecification => {
  if (selectedZone === "all") {
    return buildBuildingCategoryColorExpression();
  }

  const selectedConfig = ZONE_CONFIG.find((zone) => zone.key === selectedZone);
  const keywords = selectedConfig?.buildingKeywords ?? [];
  const selectedColor = selectedConfig?.color ?? "#22d3ee";

  return [
    "case",
    buildKeywordMatchExpression(getBuildingSearchTextExpression(), keywords),
    selectedColor,
    "#6b7280",
  ] as mapboxgl.ExpressionSpecification;
};

const ensureSelectedPlaceLayers = (map: mapboxgl.Map) => {
  if (!map.getSource(SELECTED_PLACE_SOURCE_ID)) {
    map.addSource(SELECTED_PLACE_SOURCE_ID, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
  }

  if (!map.getLayer(SELECTED_PLACE_FILL_LAYER_ID)) {
    map.addLayer({
      id: SELECTED_PLACE_FILL_LAYER_ID,
      type: "fill",
      source: SELECTED_PLACE_SOURCE_ID,
      paint: {
        "fill-color": "#22d3ee",
        "fill-opacity": 0.25,
      },
    });
  }

  if (!map.getLayer(SELECTED_PLACE_LINE_LAYER_ID)) {
    map.addLayer({
      id: SELECTED_PLACE_LINE_LAYER_ID,
      type: "line",
      source: SELECTED_PLACE_SOURCE_ID,
      paint: {
        "line-color": "#06b6d4",
        "line-width": 2,
      },
    });
  }
};

const setSelectedPlaceGeometry = (map: mapboxgl.Map, geometry: GeoJSON.Geometry | null, name: string) => {
  const source = map.getSource(SELECTED_PLACE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (!source) return;

  source.setData({
    type: "FeatureCollection",
    features: geometry
      ? [
          {
            type: "Feature",
            geometry,
            properties: { name },
          },
        ]
      : [],
  });
};

const refreshClassifiedBuildingLayer = (map: mapboxgl.Map, selectedZone: ZoneOption) => {
  if (!map.isStyleLoaded()) return;

  const data = buildClassifiedBuildingFeatureCollection(map, selectedZone);
  let source = map.getSource(CLASSIFIED_BUILDINGS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;

  if (!source) {
    map.addSource(CLASSIFIED_BUILDINGS_SOURCE_ID, { type: "geojson", data });
    source = map.getSource(CLASSIFIED_BUILDINGS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  } else {
    source.setData(data);
  }

  if (!map.getLayer(CLASSIFIED_BUILDINGS_LAYER_ID)) {
    const labelLayer = getLabelAnchorLayerId(map);
    map.addLayer(
      {
        id: CLASSIFIED_BUILDINGS_LAYER_ID,
        source: CLASSIFIED_BUILDINGS_SOURCE_ID,
        type: "fill-extrusion",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": ["coalesce", ["get", "zoneColor"], "#22d3ee"],
          "fill-extrusion-height": ["coalesce", ["get", "height"], 18],
          "fill-extrusion-base": ["coalesce", ["get", "minHeight"], 0],
          "fill-extrusion-opacity": selectedZone === "all" ? 0.92 : 0.96,
        },
      },
      labelLayer,
    );
  } else {
    map.setPaintProperty(CLASSIFIED_BUILDINGS_LAYER_ID, "fill-extrusion-opacity", selectedZone === "all" ? 0.92 : 0.96);
  }
};

const addOrUpdateZoneLayers = (
  map: mapboxgl.Map,
  selectedZone: ZoneOption,
  radiusKm: number,
) => {
  if (!map.isStyleLoaded()) return;

  if (selectedZone === "all") {
    if (map.getLayer(RADIUS_FILL_LAYER_ID)) map.removeLayer(RADIUS_FILL_LAYER_ID);
    if (map.getLayer(RADIUS_OUTLINE_LAYER_ID)) map.removeLayer(RADIUS_OUTLINE_LAYER_ID);
    if (map.getSource(RADIUS_SOURCE_ID)) map.removeSource(RADIUS_SOURCE_ID);
  } else {
    const radiusFeature = buildZoneRadiusFeatureCollection(map, selectedZone, radiusKm);

    let radiusSource = map.getSource(RADIUS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!radiusSource) {
      map.addSource(RADIUS_SOURCE_ID, {
        type: "geojson",
        data: radiusFeature,
      });
      radiusSource = map.getSource(RADIUS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    } else {
      radiusSource.setData(radiusFeature);
    }

    if (!map.getLayer(RADIUS_FILL_LAYER_ID)) {
      map.addLayer({
        id: RADIUS_FILL_LAYER_ID,
        type: "fill",
        source: RADIUS_SOURCE_ID,
        minzoom: RADIUS_VISIBILITY_MIN_ZOOM,
        layout: {
          "fill-sort-key": ["coalesce", ["get", "gradientOrder"], 0],
        },
        paint: {
          "fill-color": ["coalesce", ["get", "radiusColor"], "#06b6d4"],
          "fill-opacity": ["coalesce", ["get", "radiusOpacity"], 0.2],
        },
      });
    }

    if (!map.getLayer(RADIUS_OUTLINE_LAYER_ID)) {
      map.addLayer({
        id: RADIUS_OUTLINE_LAYER_ID,
        type: "line",
        source: RADIUS_SOURCE_ID,
        minzoom: RADIUS_VISIBILITY_MIN_ZOOM,
        paint: {
          "line-color": ["coalesce", ["get", "radiusColor"], "#0891b2"],
          "line-width": 2.3,
          "line-opacity": ["coalesce", ["get", "boundaryOpacity"], 0],
        },
      });
    }
  }

  const layers = map.getStyle()?.layers;
  if (!layers) return;

  const labelLayer = layers.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"])?.id;

  if (map.getLayer(BUILDING_LAYER_ID)) {
    map.setFilter(BUILDING_LAYER_ID, buildZoneFilterExpression("all"));
    map.setPaintProperty(BUILDING_LAYER_ID, "fill-extrusion-color", "#334155");
    map.setPaintProperty(BUILDING_LAYER_ID, "fill-extrusion-opacity", selectedZone === "all" ? 0.26 : 0.16);
    map.setPaintProperty(BUILDING_LAYER_ID, "fill-extrusion-height", [
      "coalesce",
      ["get", "height"],
      ["get", "render_height"],
      10,
    ]);
    map.setPaintProperty(BUILDING_LAYER_ID, "fill-extrusion-base", ["coalesce", ["get", "min_height"], 0]);
  } else {
    map.addLayer(
      {
        id: BUILDING_LAYER_ID,
        source: "composite",
        "source-layer": "building",
        filter: buildZoneFilterExpression("all"),
        type: "fill-extrusion",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": "#334155",
          "fill-extrusion-height": ["coalesce", ["get", "height"], ["get", "render_height"], 10],
          "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
          "fill-extrusion-opacity": selectedZone === "all" ? 0.26 : 0.16,
        },
      },
      labelLayer,
    );
  }

  updatePoiCategorizedBuildingLayer(map, selectedZone, labelLayer);
  refreshClassifiedBuildingLayer(map, selectedZone);

  if (selectedZone === "all") {
    if (map.getLayer(ZONE_POI_LABEL_LAYER_ID)) map.removeLayer(ZONE_POI_LABEL_LAYER_ID);
  } else if (map.getLayer(ZONE_POI_LABEL_LAYER_ID)) {
    map.setFilter(ZONE_POI_LABEL_LAYER_ID, buildPoiLabelFilterExpression(selectedZone));
  } else {
    map.addLayer(
      {
        id: ZONE_POI_LABEL_LAYER_ID,
        source: "composite",
        "source-layer": "poi_label",
        type: "symbol",
        filter: buildPoiLabelFilterExpression(selectedZone),
        minzoom: 11,
        layout: {
          "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
          "text-size": ["interpolate", ["linear"], ["zoom"], 11, 10, 16, 14],
          "text-offset": [0, 1.1],
          "text-anchor": "top",
          "icon-image": ["coalesce", ["get", "maki"], "marker-15"],
          "icon-size": 0.9,
          "icon-allow-overlap": false,
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#f8fafc",
          "text-halo-color": "rgba(15, 23, 42, 0.95)",
          "text-halo-width": 1.4,
        },
      },
      labelLayer,
    );
  }
};

const extractLocationPhrase = (query: string): string | undefined => {
  const match = query.match(/\b(?:in|near|around)\s+([a-z0-9\s,.-]{2,})$/i);
  return match?.[1]?.trim();
};

const parseSearchIntent = (query: string): SearchIntent => {
  const normalizedQuery = normalizeText(query);
  const terms = normalizedQuery.split(" ").filter((term) => term.length > 1);
  return {
    normalizedQuery,
    terms,
    nearMe: /\bnear me\b/i.test(query),
    best: /\bbest\b/i.test(query),
    openNow: /\bopen now\b/i.test(query),
    locationPhrase: extractLocationPhrase(query),
  };
};

const confidenceLabel = (confidence: number) => {
  if (confidence >= 0.78) return "High confidence";
  if (confidence >= 0.55) return "Medium confidence";
  return "Low confidence";
};

const scoreSuggestion = (suggestion: UniversalSuggestion, intent: SearchIntent): number => {
  const text = normalizeText(`${suggestion.name} ${suggestion.fullName}`);
  const termMatches = intent.terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
  const termScore = intent.terms.length > 0 ? termMatches / intent.terms.length : 0;

  const proximityScore = suggestion.distanceKm <= 1 ? 1 : clamp(1 - suggestion.distanceKm / 40, 0, 1);
  const bestBoost = intent.best ? 0.05 : 0;
  const nearBoost = intent.nearMe ? 0.08 : 0;

  return (
    termScore * 0.34 +
    suggestion.relevance * 0.24 +
    suggestion.importance * 0.14 +
    proximityScore * 0.18 +
    suggestion.confidence * 0.1 +
    bestBoost +
    nearBoost
  );
};

const highlightText = (text: string, rawQuery: string): ReactNode => {
  const query = rawQuery.trim();
  if (!query) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={`${part}-${index}`} style={{ color: "#22d3ee", fontWeight: 700 }}>
        {part}
      </span>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
};

declare global {
  interface Window {
    nivaariVoteReport?: (reportId: string, vote: "upvote" | "downvote") => Promise<void>;
  }
}

export default function HomePage() {
  const { logout } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const reportMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const reportLocationMapContainerRef = useRef<HTMLDivElement | null>(null);
  const reportLocationMapRef = useRef<mapboxgl.Map | null>(null);
  const reportLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const reportsRef = useRef<ReportItem[]>([]);
  const userLocationRef = useRef<LngLatTuple | null>(null);
  const selectedZoneRef = useRef<ZoneOption>("all");
  const is3DEnabledRef = useRef(true);
  const mapStyleModeRef = useRef<keyof typeof MAP_STYLE_LABELS>("streets");
  const focusPointRef = useRef<LngLatTuple | null>(null);
  const cacheRef = useRef<Map<string, { ts: number; items: UniversalSuggestion[] }>>(new Map());

  const [selectedZone, setSelectedZone] = useState<ZoneOption>("all");
  const [focusPoint, setFocusPoint] = useState<LngLatTuple | null>(null);
  const [mapStyleMode, setMapStyleMode] = useState<keyof typeof MAP_STYLE_LABELS>("streets");
  const [is3DEnabled, setIs3DEnabled] = useState(true);
  const [mapStatus, setMapStatus] = useState("Loading civic map...");

  const [searchText, setSearchText] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<UniversalSuggestion[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<UniversalSuggestion[]>([]);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [nearbyInsights, setNearbyInsights] = useState<string[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isReportChatOpen, setIsReportChatOpen] = useState(false);
  const [reportMessages, setReportMessages] = useState<ReportChatMessage[]>([
    {
      role: "assistant",
      text: "Hi, I am your civic report assistant. Describe the issue and I will verify details before submitting it.",
    },
  ]);
  const [reportInput, setReportInput] = useState("");
  const [reportDraft, setReportDraft] = useState<ReportDraft>({});
  const [reportReadyToSubmit, setReportReadyToSubmit] = useState(false);
  const [isReportThinking, setIsReportThinking] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportStatusMessage, setReportStatusMessage] = useState("");
  const [isReportLocationPickerOpen, setIsReportLocationPickerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [reportImagePreview, setReportImagePreview] = useState<string | null>(null);
  const [isDetectingIssue, setIsDetectingIssue] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);

  const voteReport = useCallback(async (reportId: string, vote: "upvote" | "downvote") => {
    try {
      const response = await fetch(`/api/citizen-reports/${reportId}/vote`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vote }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body?.error ?? "Unable to submit vote");
        return;
      }

      await loadReports();
      toast.success(vote === "upvote" ? "Upvote recorded" : "Downvote recorded");
    } catch {
      toast.error("Unable to submit vote right now");
    }
  }, []);

  useEffect(() => {
    window.nivaariVoteReport = async (reportId: string, vote: "upvote" | "downvote") => {
      await voteReport(reportId, vote);
    };

    return () => {
      delete window.nivaariVoteReport;
    };
  }, [voteReport]);

  const zoneLabelMap = useMemo(
    () => ({
      all: "All",
      commercial: "Commercial",
      agriculture: "Agriculture",
      educational: "Educational",
      residential: "Residential",
      industrial: "Industrial",
      health: "Health",
      railway_station: "Railway Station",
      food: "Food",
      hotel: "Hotel",
      entertainment: "Entertainment",
    }),
    [],
  );

  const getActiveRadiusCenter = (map: mapboxgl.Map): LngLatTuple => {
    if (focusPointRef.current) return focusPointRef.current;
    if (userLocationRef.current) return userLocationRef.current;
    const center = map.getCenter();
    return [center.lng, center.lat];
  };

  const saveRecentSearch = (item: UniversalSuggestion) => {
    const stamped = { ...item, searchedAt: Date.now() };
    setRecentSearches((previous) => {
      const merged = [stamped, ...previous.filter((entry) => entry.id !== stamped.id)].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(merged));
      } catch {
        // Ignore localStorage write failures.
      }
      return merged;
    });
  };

  const refreshReportsOnMap = (map: mapboxgl.Map, reportRows: ReportItem[]) => {
    reportMarkersRef.current.forEach((marker) => marker.remove());
    reportMarkersRef.current = [];

    reportRows.forEach((report) => {
      const lat = report.location?.lat;
      const lng = report.location?.lng;
      if (typeof lat !== "number" || typeof lng !== "number") return;

      const meta = getReportMeta(report.type);
      const markerEl = document.createElement("button");
      markerEl.type = "button";
      markerEl.style.width = "34px";
      markerEl.style.height = "34px";
      markerEl.style.borderRadius = "999px";
      markerEl.style.border = "2px solid rgba(255,255,255,0.88)";
      markerEl.style.background = meta.color;
      markerEl.style.display = "grid";
      markerEl.style.placeItems = "center";
      markerEl.style.cursor = "pointer";
      markerEl.style.fontSize = "12px";
      markerEl.style.fontWeight = "900";
      markerEl.style.color = "#fff";
      markerEl.style.letterSpacing = "0";
      markerEl.style.boxShadow = "0 8px 16px rgba(2,6,23,0.4)";
      markerEl.textContent = getReportMarkerLabel(report.type);
      markerEl.title = `${meta.label}: ${report.title}`;

      const popupHtml = `
        <div style="min-width:220px;max-width:290px;font-family:system-ui,sans-serif;">
          <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px;">${report.title}</div>
          <div style="font-size:12px;color:#334155;margin-bottom:8px;">${meta.label}</div>
          <div style="font-size:12px;color:#1e293b;line-height:1.45;white-space:pre-wrap;">${report.description ?? "No additional details"}</div>
          ${report.aiSummary ? `<div style="font-size:12px;color:#0f172a;margin-top:8px;"><strong>AI Summary:</strong> ${report.aiSummary}</div>` : ""}
          ${typeof report.impactRadiusKm === "number" && report.impactRadiusKm > 0 ? `<div style="font-size:12px;color:#0f172a;margin-top:6px;">Impact Radius: ${report.impactRadiusKm.toFixed(2)} km</div>` : ""}
          ${report.createdBySocialId ? `<div style="font-size:11px;color:#334155;margin-top:6px;">Reported by: <strong>${report.createdBySocialId}</strong></div>` : ""}
          <div style="display:flex;gap:8px;margin-top:10px;">
            <button
              type="button"
              onclick="window.nivaariVoteReport && window.nivaariVoteReport('${report.id}', 'upvote')"
              style="border:1px solid rgba(22,163,74,0.4);background:${report.myVote === "upvote" ? "rgba(22,163,74,0.2)" : "rgba(241,245,249,0.95)"};color:#166534;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer;"
            >Up ${report.upvotes ?? 0}</button>
            <button
              type="button"
              onclick="window.nivaariVoteReport && window.nivaariVoteReport('${report.id}', 'downvote')"
              style="border:1px solid rgba(220,38,38,0.35);background:${report.myVote === "downvote" ? "rgba(220,38,38,0.2)" : "rgba(241,245,249,0.95)"};color:#991b1b;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer;"
            >Down ${report.downvotes ?? 0}</button>
          </div>
          <div style="font-size:11px;color:#475569;margin-top:8px;">Pin ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: markerEl, anchor: "bottom" })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 18 }).setHTML(popupHtml))
        .addTo(map);

      reportMarkersRef.current.push(marker);
    });

    if (map.isStyleLoaded()) {
      ensureReportImpactLayers(map, reportRows);
    }
  };

  const loadReports = async () => {
    try {
      const response = await fetch("/api/citizen-reports", { method: "GET" });
      if (!response.ok) return;
      const body = (await response.json()) as { reports?: ReportItem[] };
      const list = (body.reports ?? []).map((report) => ({
        ...report,
        type: normalizeReportType(report.type),
      })) as ReportItem[];
      setReports(list);
    } catch {
      // Keep map usable if reports fetch fails.
    }
  };

  const resolveAutoLocation = async (): Promise<{ lat?: number; lng?: number }> => {
    if (userLocationRef.current) {
      return { lat: userLocationRef.current[1], lng: userLocationRef.current[0] };
    }

    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        const center = mapRef.current?.getCenter();
        resolve({ lat: center?.lat, lng: center?.lng });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const current: LngLatTuple = [position.coords.longitude, position.coords.latitude];
          userLocationRef.current = current;
          resolve({ lat: current[1], lng: current[0] });
        },
        () => {
          const center = mapRef.current?.getCenter();
          resolve({ lat: center?.lat, lng: center?.lng });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
      );
    });
  };

  const hasExactReportLocation = (location?: ReportDraft["location"]) =>
    typeof location?.lat === "number" && typeof location?.lng === "number";

  const getReportPickerCenter = (): LngLatTuple => {
    const location = reportDraft.location;
    if (hasExactReportLocation(location)) {
      return [location.lng as number, location.lat as number];
    }

    if (userLocationRef.current) {
      return userLocationRef.current;
    }

    const mapCenter = mapRef.current?.getCenter();
    if (mapCenter) {
      return [mapCenter.lng, mapCenter.lat];
    }

    return [77.5946, 12.9716];
  };

  const resolveReportDraftLocation = async (draft: ReportDraft) => draft.location;

  const sendReportMessage = async () => {
    const text = reportInput.trim();
    if (!text || isReportThinking) return;

    const userMessage: ReportChatMessage = { role: "user", text };
    const nextHistory = [...reportMessages, userMessage];
    setReportMessages(nextHistory);
    setReportInput("");
    setIsReportThinking(true);
    setReportStatusMessage("");

    try {
      const autoLocation = await resolveAutoLocation();
      const response = await fetch("/api/citizen-reports/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: nextHistory,
          draft: reportDraft,
          userLocation:
            typeof autoLocation.lat === "number" && typeof autoLocation.lng === "number"
              ? { lat: autoLocation.lat, lng: autoLocation.lng }
              : undefined,
        }),
      });

      if (!response.ok) {
        setReportMessages((prev) => [
          ...prev,
          { role: "assistant", text: "I could not process this right now. Please add type, location, and impact details manually." },
        ]);
        return;
      }

      const body = (await response.json()) as {
        assistantMessage: string;
        draft: ReportDraft;
        verificationQuestions?: string[];
        readyToSubmit?: boolean;
      };

      setReportDraft((prev) => ({
        ...prev,
        ...body.draft,
        verificationQuestions: body.verificationQuestions ?? prev.verificationQuestions,
        location: {
          lat: body.draft.location?.lat ?? prev.location?.lat,
          lng: body.draft.location?.lng ?? prev.location?.lng,
          address: body.draft.location?.address ?? prev.location?.address,
        },
      }));

      const mergedDraft: ReportDraft = {
        ...reportDraft,
        ...body.draft,
        verificationQuestions: body.verificationQuestions ?? reportDraft.verificationQuestions,
        location: {
          lat: body.draft.location?.lat ?? reportDraft.location?.lat,
          lng: body.draft.location?.lng ?? reportDraft.location?.lng,
          address: body.draft.location?.address ?? reportDraft.location?.address,
        },
      };

      const resolvedLocation = await resolveReportDraftLocation(mergedDraft);
      const isReady = Boolean(
        mergedDraft.type &&
          mergedDraft.description &&
          resolvedLocation &&
          typeof resolvedLocation.lat === "number" && typeof resolvedLocation.lng === "number",
      );

      const needsLocationPicker =
        !hasExactReportLocation(resolvedLocation) &&
        Boolean(
          (body.verificationQuestions ?? []).some((question) => /location|where|pin/i.test(question)) ||
            /where exactly|exact location|pin.*map|open the map/i.test(body.assistantMessage),
        );

      setReportDraft((prev) => ({
        ...prev,
        location: resolvedLocation ?? prev.location,
      }));
      setReportReadyToSubmit(Boolean(body.readyToSubmit || isReady));
      setIsReportLocationPickerOpen(needsLocationPicker);
      setReportMessages((prev) => [...prev, { role: "assistant", text: body.assistantMessage }]);
    } catch {
      setReportMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Network error while processing the report. Please retry." },
      ]);
    } finally {
      setIsReportThinking(false);
    }
  };

  const submitVerifiedReport = async () => {
    if (isSubmittingReport) return;

    const resolvedLocation = await resolveReportDraftLocation(reportDraft);
    const location = resolvedLocation ?? reportDraft.location;

    if (!reportDraft.type || !reportDraft.description || !hasExactReportLocation(location)) {
      setReportStatusMessage("Please provide issue details and location before submitting.");
      return;
    }

    const finalLocation = location;

    setIsSubmittingReport(true);
    setReportStatusMessage("");

    try {
      const payload = {
        title: reportDraft.title || `${getReportMeta(reportDraft.type).label} Report`,
        type: reportDraft.type,
        category: reportDraft.type,
        description: reportDraft.description,
        location: finalLocation,
        impactRadiusKm: reportDraft.impactRadiusKm,
        aiSummary: reportMessages
          .filter((item) => item.role === "assistant")
          .slice(-1)[0]
          ?.text,
        verificationQuestions: reportDraft.verificationQuestions,
        chatHistory: reportMessages,
      };

      const response = await fetch("/api/citizen-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setReportStatusMessage("Failed to submit report. Please try again.");
        return;
      }

      await loadReports();
      setReportStatusMessage("Report submitted successfully.");
      setIsReportChatOpen(false);
      setReportReadyToSubmit(false);
      setReportDraft({});
      setReportMessages([
        {
          role: "assistant",
          text: "Hi, I am your civic report assistant. Describe the issue and I will verify details before submitting it.",
        },
      ]);
    } catch {
      setReportStatusMessage("Report submission failed due to network issue.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDetectIssueFromImage = async (imageFile: File, preview: string) => {
    setReportImagePreview(preview);
    setIsDetectingIssue(true);
    setDetectionMessage(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch("/api/detect-issue", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        setDetectionMessage(
          error.error || "Failed to detect issue from image. Please try again."
        );
        setIsDetectingIssue(false);
        return;
      }

      const result = await response.json();
      const { reportType, category, confidence } = result;

      // Auto-populate report draft with detected information
      setReportDraft((prev) => ({
        ...prev,
        type: reportType as ReportType,
        description: `Detected: ${category} (Confidence: ${(confidence * 100).toFixed(1)}%)`,
        impactRadiusKm: 0.1, // Default small impact radius for point issues
      }));

      // Send detection result to AI for verification
      const detectionSummary = `I detected a ${category} issue in the uploaded image with ${(confidence * 100).toFixed(1)}% confidence. The system has automatically classified this as a "${getReportMeta(reportType).label}" issue. Please confirm if this is correct and provide additional details about the location and severity.`;

      setReportMessages((prev) => [...prev, { role: "user", text: detectionSummary }]);
      setDetectionMessage(
        `✓ Detected: ${category} (${(confidence * 100).toFixed(1)}% confidence)`
      );

      // Trigger AI verification
      setIsReportThinking(true);
      try {
        const verificationResponse = await fetch("/api/citizen-reports/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            history: [
              ...reportMessages,
              { role: "user", text: detectionSummary },
            ],
          }),
        });

        if (verificationResponse.ok) {
          const verificationBody = await verificationResponse.json();
          setReportMessages((prev) => [
            ...prev,
            { role: "assistant", text: verificationBody.assistantMessage },
          ]);

          if (verificationBody.draft) {
            setReportDraft((prev) => ({
              ...prev,
              ...verificationBody.draft,
            }));
          }

          if (verificationBody.readyToSubmit) {
            setReportReadyToSubmit(true);
          }
        }
      } finally {
        setIsReportThinking(false);
      }
    } catch (error) {
      console.error("Detection error:", error);
      setDetectionMessage(
        "Connection error. Please ensure the local model service is running on https://deception-resonant-deserving.ngrok-free.dev"
      );
    } finally {
      setIsDetectingIssue(false);
    }
  };

  useEffect(() => {
    if (!isReportLocationPickerOpen) {
      reportLocationMarkerRef.current?.remove();
      reportLocationMarkerRef.current = null;
    try {
      reportLocationMapRef.current?.remove();
    } catch (error) {
      console.warn("Failed to remove report location map during cleanup:", error);
    }
    }

    const container = reportLocationMapContainerRef.current;
    if (!container) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
    if (!token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container,
      style: STREETS_STYLE,
      center: getReportPickerCenter(),
      zoom: 16,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    reportLocationMapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    const syncMarker = (lngLat: LngLatTuple) => {
      reportLocationMarkerRef.current?.remove();
      reportLocationMarkerRef.current = new mapboxgl.Marker({ color: "#fb7185" }).setLngLat(lngLat).addTo(map);
      setReportDraft((previous) => ({
        ...previous,
        location: {
          ...previous.location,
          lng: lngLat[0],
          lat: lngLat[1],
        },
      }));
    };

    syncMarker(getReportPickerCenter());

    map.on("click", (event) => {
      syncMarker([event.lngLat.lng, event.lngLat.lat]);
      setReportStatusMessage("Exact location pinned on the map.");
      setReportReadyToSubmit(Boolean(reportDraft.type && reportDraft.description));
    });

    map.on("load", () => {
      map.resize();
    });

    return () => {
      reportLocationMarkerRef.current?.remove();
      reportLocationMarkerRef.current = null;
      try {
        map.remove();
      } catch (error) {
        console.warn("Failed to remove report location map during effect cleanup:", error);
      }
      reportLocationMapRef.current = null;
    };
  }, [isReportLocationPickerOpen]);

  const fetchPlacePhoto = async (
    name: string,
    center: LngLatTuple,
    signal?: AbortSignal,
  ): Promise<{ url?: string; source?: string }> => {
    try {
      const params = new URLSearchParams({
        name,
        lat: String(center[1]),
        lng: String(center[0]),
      });

      const response = await fetch(`/api/place-photo?${params.toString()}`, { signal });
      if (!response.ok) return {};

      const body = (await response.json()) as { imageUrl?: string; source?: string };
      return { url: body.imageUrl, source: body.source };
    } catch {
      return {};
    }
  };

  const getNearbyPlaceNames = async (center: LngLatTuple, signal?: AbortSignal): Promise<string[]> => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
    if (!token) return [];

    const terms = ["institution", "residential building", "transport", "landmark", "office", "school"];

    const responses = await Promise.all(
      terms.map(async (term) => {
        try {
          const params = new URLSearchParams({
            limit: "2",
            proximity: `${center[0]},${center[1]}`,
            types: "poi,address",
            language: "en",
            access_token: token,
          });
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json?${params.toString()}`;
          const response = await fetch(url, { signal });
          if (!response.ok) return [] as string[];

          const data = (await response.json()) as { features?: MapboxFeature[] };
          return (data.features ?? []).map((feature) => feature.text ?? feature.place_name ?? "").filter(Boolean);
        } catch {
          return [] as string[];
        }
      }),
    );

    return Array.from(new Set(responses.flat())).slice(0, 8);
  };

  const fetchMapboxResults = async (
    query: string,
    center: { lng: number; lat: number },
    limit: number,
    signal?: AbortSignal,
  ): Promise<UniversalSuggestion[]> => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
    if (!token) return [];

    const params = new URLSearchParams({
      limit: String(Math.max(limit, 10)),
      autocomplete: "true",
      types: "poi,address,street,place,locality,neighborhood,district,postcode",
      proximity: `${center.lng},${center.lat}`,
      language: "en",
      access_token: token,
    });

    const indiaUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}&country=IN`;
    const globalUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;

    const settled = await Promise.allSettled([fetch(indiaUrl, { signal }), fetch(globalUrl, { signal })]);
    const payloads = await Promise.all(
      settled.map(async (result) => {
        if (result.status !== "fulfilled" || !result.value.ok) return null;
        return (await result.value.json()) as { features?: MapboxFeature[] };
      }),
    );

    const deduped = new Map<string, MapboxFeature>();
    payloads.forEach((body) => {
      (body?.features ?? []).forEach((feature) => {
        if (feature.id && feature.center && feature.place_name) deduped.set(feature.id, feature);
      });
    });

    return Array.from(deduped.values()).map((feature) => {
      const name = feature.text ?? feature.place_name ?? "Unknown";
      const fullName = feature.place_name ?? name;
      const placeTypes = feature.place_type ?? [];
      const precision: PrecisionType = placeTypes.includes("poi") || placeTypes.includes("address") ? "exact" : "approximate";
      const distanceKm = calculateDistance(center.lng, center.lat, feature.center![0], feature.center![1]);
      const relevance = feature.relevance ?? 0.6;
      const importance = placeTypes.includes("poi") ? 0.8 : 0.6;
      const baseConfidence = 0.72 + relevance * 0.14 + (precision === "exact" ? 0.1 : -0.06);
      const confidence = clamp(baseConfidence, 0, 1);

      return {
        id: `mb-${feature.id}`,
        name,
        fullName,
        center: feature.center!,
        typeLabel: detectTypeLabel(name, fullName),
        distanceKm,
        relevance,
        importance,
        confidence,
        precision,
        confidenceLabel: confidenceLabel(confidence),
        approximateReason: precision === "approximate" ? "Area-level geocode from Mapbox" : undefined,
        source: "mapbox" as const,
      };
    });
  };

  const fetchOSMResults = async (
    query: string,
    center: { lng: number; lat: number },
    limit: number,
    signal?: AbortSignal,
  ): Promise<UniversalSuggestion[]> => {
    try {
      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: String(Math.max(limit, 10)),
        addressdetails: "1",
        dedupe: "1",
      });

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, { signal });
      if (!response.ok) return [];

      const data = (await response.json()) as OSMFeature[];
      return data
        .flatMap((item) => {
          const lat = Number(item.lat);
          const lng = Number(item.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || !item.display_name) return [];

          const name = item.name || item.display_name.split(",")[0] || "Unknown";
          const fullName = item.display_name;
          const precision: PrecisionType = item.class === "building" || item.type === "house" ? "exact" : "approximate";
          const relevance = clamp((item.importance ?? 0.4) + 0.2, 0, 1);
          const importance = clamp(item.importance ?? 0.45, 0, 1);
          const confidence = clamp(0.55 + relevance * 0.18 + (precision === "exact" ? 0.08 : -0.08), 0, 1);

          return [
            {
              id: `osm-${item.place_id ?? item.osm_id ?? `${lat}-${lng}`}`,
              name,
              fullName,
              center: [lng, lat] as LngLatTuple,
              typeLabel: detectTypeLabel(name, fullName),
              distanceKm: calculateDistance(center.lng, center.lat, lng, lat),
              relevance,
              importance,
              confidence,
              precision,
              confidenceLabel: confidenceLabel(confidence),
              approximateReason: precision === "approximate" ? "OSM place-level result" : undefined,
              source: "osm" as const,
            } satisfies UniversalSuggestion,
          ];
        })
        .slice(0, limit);
    } catch {
      return [];
    }
  };

  const mergeAndValidate = (
    mapboxItems: UniversalSuggestion[],
    osmItems: UniversalSuggestion[],
    intent: SearchIntent,
  ): UniversalSuggestion[] => {
    const merged: UniversalSuggestion[] = [];

    const attach = (candidate: UniversalSuggestion) => {
      const keyText = normalizeText(candidate.name);
      const duplicateIndex = merged.findIndex((item) => {
        const sameName = normalizeText(item.name) === keyText || keyText.includes(normalizeText(item.name));
        const close = calculateDistance(item.center[0], item.center[1], candidate.center[0], candidate.center[1]) <= 0.35;
        return sameName && close;
      });

      if (duplicateIndex === -1) {
        merged.push(candidate);
        return;
      }

      const current = merged[duplicateIndex];
      const crossChecked = current.source !== candidate.source;
      const preferred = current.confidence >= candidate.confidence ? current : candidate;
      const mergedConfidence = clamp(Math.max(current.confidence, candidate.confidence) + (crossChecked ? 0.16 : 0), 0, 1);

      merged[duplicateIndex] = {
        ...preferred,
        confidence: mergedConfidence,
        confidenceLabel: confidenceLabel(mergedConfidence),
        source: crossChecked ? "hybrid" : preferred.source,
        precision:
          current.precision === "exact" || candidate.precision === "exact" ? "exact" : preferred.precision,
        approximateReason:
          current.precision === "exact" || candidate.precision === "exact"
            ? undefined
            : preferred.approximateReason ?? "Cross-source area-level estimate",
      };
    };

    mapboxItems.forEach(attach);
    osmItems.forEach(attach);

    const ranked = merged
      .map((item) => ({ item, score: scoreSuggestion(item, intent) }))
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);

    const highConfidence = ranked.filter((item) => item.confidence >= MIN_CONFIDENCE_DEFAULT);
    return highConfidence.length > 0 ? highConfidence : ranked;
  };

  const enrichWithImages = async (
    items: UniversalSuggestion[],
    signal?: AbortSignal,
  ): Promise<UniversalSuggestion[]> => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

    const enriched = await Promise.all(
      items.map(async (item) => {
        const externalPhoto = await fetchPlacePhoto(item.name, item.center, signal);
        return {
          ...item,
          thumbnailUrl: externalPhoto.url || buildStaticPreviewImage(item.center, token),
        };
      }),
    );

    return enriched;
  };

  const searchUniversal = async (
    query: string,
    limit: number,
    signal?: AbortSignal,
  ): Promise<UniversalSuggestion[]> => {
    const map = mapRef.current;
    const center = map
      ? { lng: map.getCenter().lng, lat: map.getCenter().lat }
      : { lng: 72.8777, lat: 19.076 };

    const intent = parseSearchIntent(query);
    const cacheKey = normalizeText(query);
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.ts < SEARCH_CACHE_TTL_MS) {
      return cached.items.slice(0, limit);
    }

    let searchQuery = query.trim();
    if (intent.locationPhrase && !intent.normalizedQuery.includes(normalizeText(intent.locationPhrase))) {
      searchQuery = `${searchQuery} ${intent.locationPhrase}`.trim();
    }

    const [mapboxItems, osmItems] = await Promise.all([
      fetchMapboxResults(searchQuery, center, limit * 2, signal),
      fetchOSMResults(searchQuery, center, limit * 2, signal),
    ]);

    const merged = mergeAndValidate(mapboxItems, osmItems, intent).slice(0, limit);
    const enriched = await enrichWithImages(merged, signal);

    cacheRef.current.set(cacheKey, { ts: Date.now(), items: enriched });
    return enriched;
  };

  const applySearchSelection = async (item: UniversalSuggestion) => {
    const map = mapRef.current;
    if (!map) return;

    setSearchText(item.fullName);
    setDropdownOpen(false);
    setActiveSuggestionIndex(-1);

    map.flyTo({ center: item.center, zoom: 16.2, speed: 0.9, curve: 1.2, essential: true });

    const point = map.project(item.center);
    const hasBuildingLayer = Boolean(map.getLayer(BUILDING_LAYER_ID));
    const features = hasBuildingLayer
      ? map.queryRenderedFeatures(
          [
            [point.x - 8, point.y - 8],
            [point.x + 8, point.y + 8],
          ],
          { layers: [BUILDING_LAYER_ID] },
        )
      : [];

    const buildingFeature = features.find(
      (feature) => feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon",
    );

    if (buildingFeature) {
      markerRef.current?.remove();
      markerRef.current = null;
      setSelectedPlaceGeometry(map, buildingFeature.geometry as GeoJSON.Geometry, item.name);
    } else {
      setSelectedPlaceGeometry(map, null, item.name);
      markerRef.current?.remove();
      markerRef.current = new mapboxgl.Marker({ color: "#22d3ee" }).setLngLat(item.center).addTo(map);
    }

    const nearby = await getNearbyPlaceNames(item.center);
    setNearbyInsights(nearby);

    popupRef.current?.remove();
    const popupHtml = `
      <div style="font-family: system-ui, sans-serif; min-width: 220px; max-width: 280px;">
        <div style="font-weight:700;margin-bottom:4px;">${item.name}</div>
        <div style="font-size:12px;color:#334155;margin-bottom:6px;">${item.typeLabel} · ${item.precision === "exact" ? "Exact location" : "Approximate area"}</div>
        ${
          item.thumbnailUrl
            ? `<img src="${item.thumbnailUrl}" alt="${item.name}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
            : ""
        }
        <div style="font-size:12px;color:#475569;">${item.fullName}</div>
        <div style="font-size:12px;color:#0f172a;margin-top:6px;">Distance: ${formatDistance(item.distanceKm)}</div>
        <div style="font-size:12px;color:#0f172a;">Confidence: ${item.confidenceLabel} (${Math.round(item.confidence * 100)}%)</div>
        ${
          item.precision === "approximate"
            ? `<div style="font-size:12px;color:#7c2d12;margin-top:6px;">Location may be approximate.</div>`
            : ""
        }
        ${
          nearby.length > 0
            ? `<div style="font-size:12px;color:#0f172a;margin-top:8px;"><strong>Nearby:</strong> ${nearby.slice(0, 5).join(", ")}</div>`
            : ""
        }
      </div>
    `;

    popupRef.current = new mapboxgl.Popup({ offset: 18 }).setLngLat(item.center).setHTML(popupHtml).addTo(map);

    saveRecentSearch(item);
    setSearchMessage(
      item.precision === "exact"
        ? `Found exact location: ${item.name}`
        : `Found approximate area: ${item.name}. Location may be approximate.`,
    );
  };

  const onSubmitSearch = async () => {
    if (isSearching) return;

    const query = searchText.trim();
    if (query.length < 2) {
      setSearchMessage("Type at least 2 characters to search.");
      return;
    }

    setIsSearching(true);
    setSearchMessage("");

    try {
      const selected = activeSuggestionIndex >= 0 ? suggestions[activeSuggestionIndex] : undefined;
      if (selected) {
        await applySearchSelection(selected);
        return;
      }

      const items = await searchUniversal(query, 8);
      if (items.length === 0) {
        setSearchMessage("No results found. Try a broader query like area or city name.");
        return;
      }

      await applySearchSelection(items[0]);
    } catch {
      setSearchMessage("Search failed. Check your connection and try again.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as UniversalSuggestion[];
      if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, []);

  useEffect(() => {
    reportsRef.current = reports;
    const map = mapRef.current;
    if (!map) return;
    refreshReportsOnMap(map, reports);
  }, [reports]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
    if (!token) {
      setMapStatus("Mapbox token missing. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to enable the map.");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: STREETS_STYLE,
      center: [72.8777, 19.076],
      zoom: 15,
      pitch: DEFAULT_MAP_PITCH,
      bearing: DEFAULT_MAP_BEARING,
      antialias: true,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }), "top-right");
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right",
    );
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 140, unit: "metric" }), "bottom-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      applyMapTheme(map);
      map.resize();
    });

    const refreshZoneLayers = () => {
      addOrUpdateZoneLayers(map, selectedZoneRef.current, DEFAULT_RADIUS_KM);
    };

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const current: LngLatTuple = [position.coords.longitude, position.coords.latitude];
          userLocationRef.current = current;
          setFocusPoint((prev) => prev ?? current);
        },
        () => {
          // Keep usable without location permission.
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    }

    map.on("style.load", () => {
      if (is3DEnabledRef.current) {
        if (map.getPitch() < DEFAULT_MAP_PITCH) map.setPitch(DEFAULT_MAP_PITCH);
        if (map.getBearing() !== DEFAULT_MAP_BEARING) map.setBearing(DEFAULT_MAP_BEARING);
        enableMapTerrain(map);
      } else {
        disableMapTerrain(map);
      }
      applyMapTheme(map);
      if (map.getZoom() < MIN_3D_ZOOM) map.setZoom(MIN_3D_ZOOM);

      ensureTransport3DLayers(map);
      ensureSelectedPlaceLayers(map);
      refreshZoneLayers();
      ensureReportImpactLayers(map, reportsRef.current);
      refreshReportsOnMap(map, reportsRef.current);
      setMapStatus(`${MAP_STYLE_LABELS[mapStyleModeRef.current]} map ready`);
    });

    map.on("click", (event) => {
      if (selectedZoneRef.current !== "all") {
        const clicked: LngLatTuple = [event.lngLat.lng, event.lngLat.lat];
        focusPointRef.current = clicked;
        setFocusPoint(clicked);
      }
    });

    const handleMoveEnd = () => {
      refreshZoneLayers();
      const center = map.getCenter();
      setMapStatus(`Center ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)} | Zoom ${map.getZoom().toFixed(1)}`);
    };
    const handleMapError = () => {
      setMapStatus("Map service error. Check the token, network, or style access.");
    };

    map.on("moveend", handleMoveEnd);
    map.on("zoomend", refreshZoneLayers);
    map.on("error", handleMapError);

    return () => {
      map.off("moveend", handleMoveEnd);
      map.off("zoomend", refreshZoneLayers);
      map.off("error", handleMapError);
      reportMarkersRef.current.forEach((marker) => marker.remove());
      reportMarkersRef.current = [];
      mapRef.current = null;
      markerRef.current?.remove();
      popupRef.current?.remove();
      map.remove();
    };
  }, []);

  useEffect(() => {
    selectedZoneRef.current = selectedZone;
    const map = mapRef.current;
    if (!map) return;
    addOrUpdateZoneLayers(map, selectedZone, DEFAULT_RADIUS_KM);
  }, [selectedZone]);

  useEffect(() => {
    mapStyleModeRef.current = mapStyleMode;
    const map = mapRef.current;
    if (!map) return;

    const styleUrl = mapStyleMode === "satellite" ? SATELLITE_STYLE : STREETS_STYLE;
    setMapStatus(`Switching to ${MAP_STYLE_LABELS[mapStyleMode]} view...`);
    map.setStyle(styleUrl);
  }, [mapStyleMode]);

  useEffect(() => {
    is3DEnabledRef.current = is3DEnabled;
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (is3DEnabled) {
      map.easeTo({ pitch: DEFAULT_MAP_PITCH, bearing: DEFAULT_MAP_BEARING, duration: 650 });
      enableMapTerrain(map);
    } else {
      disableMapTerrain(map);
      map.easeTo({ pitch: 0, bearing: 0, duration: 650 });
    }
  }, [is3DEnabled]);

  useEffect(() => {
    focusPointRef.current = focusPoint;
    const map = mapRef.current;
    if (!map) return;
    addOrUpdateZoneLayers(map, selectedZoneRef.current, DEFAULT_RADIUS_KM);
  }, [focusPoint]);

  useEffect(() => {
    const query = searchText.trim();

    if (query.length === 0) {
      setSuggestions(recentSearches.slice(0, 6));
      setDropdownOpen(false);
      setActiveSuggestionIndex(-1);
      setIsLoadingSuggestions(false);
      return;
    }

    if (query.length < 2) {
      setSuggestions([]);
      setDropdownOpen(false);
      setActiveSuggestionIndex(-1);
      setIsLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const items = await searchUniversal(query, 10, controller.signal);
        setSuggestions(items);
        setDropdownOpen(items.length > 0);
        setActiveSuggestionIndex(items.length > 0 ? 0 : -1);

        if (items.length === 0) {
          setSearchMessage("No exact result found. Try broader queries like city, area, or landmark.");
        }
      } catch {
        setSuggestions([]);
        setDropdownOpen(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchText, recentSearches]);

  useEffect(() => {
    if (!searchMessage) return;

    const timer = setTimeout(() => {
      setSearchMessage("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [searchMessage]);

  useEffect(() => {
    if (nearbyInsights.length === 0) return;

    const timer = setTimeout(() => {
      setNearbyInsights([]);
    }, 9000);

    return () => clearTimeout(timer);
  }, [nearbyInsights]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen && ["ArrowDown", "ArrowUp"].includes(event.key)) {
      setDropdownOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
        void applySearchSelection(suggestions[activeSuggestionIndex]);
      } else {
        void onSubmitSearch();
      }
      return;
    }

    if (event.key === "Escape") {
      setDropdownOpen(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const closeAndClearSearchBar = () => {
    setSearchText("");
    setSuggestions([]);
    setDropdownOpen(false);
    setActiveSuggestionIndex(-1);
    setSearchMessage("");
    setShowSearchBar(false);
  };

  const openReportChat = (type?: ReportType) => {
    if (type) {
      const meta = getReportMeta(type);
      setReportDraft((previous) => ({ ...previous, type, title: previous.title ?? `${meta.label} Report` }));
      setReportInput((previous) => previous || `${meta.label} issue near `);
      setReportStatusMessage(`Started a ${meta.label.toLowerCase()} report. Add location and severity.`);
    }
    setIsReportChatOpen(true);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      window.location.href = "/auth";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <div
        ref={mapContainerRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 0%, rgba(56,189,248,0.14), transparent 32%), radial-gradient(circle at 14% 18%, rgba(244,114,182,0.12), transparent 28%), radial-gradient(circle at 88% 10%, rgba(34,197,94,0.08), transparent 30%), linear-gradient(180deg, rgba(2,6,23,0.1), rgba(2,6,23,0.38) 62%, rgba(2,6,23,0.56))",
          mixBlendMode: "screen",
        }}
      />

      <button
        type="button"
        onClick={() => {
          void handleLogout();
        }}
        disabled={isLoggingOut}
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 32,
          height: 40,
          borderRadius: 999,
          border: "1px solid rgba(251,113,133,0.4)",
          background:
            "linear-gradient(145deg, rgba(30,41,59,0.85), rgba(15,23,42,0.78)), radial-gradient(circle at 12% 12%, rgba(251,113,133,0.22), transparent 45%)",
          color: "#ffe4e6",
          fontSize: 13,
          fontWeight: 700,
          cursor: isLoggingOut ? "not-allowed" : "pointer",
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 12px 26px rgba(2,6,23,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
          backdropFilter: "blur(14px) saturate(170%)",
          opacity: isLoggingOut ? 0.7 : 1,
        }}
      >
        {isLoggingOut ? "Logging out..." : "Logout"}
      </button>

      <div
        className="map-command-bar"
        style={{
          position: "fixed",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderRadius: 999,
          border: "1px solid rgba(186,230,253,0.24)",
          background: "linear-gradient(145deg, rgba(2,6,23,0.72), rgba(15,23,42,0.58))",
          color: "#dbeafe",
          padding: "7px 9px",
          boxShadow: "0 14px 34px rgba(2,6,23,0.44), inset 0 1px 0 rgba(255,255,255,0.08)",
          backdropFilter: "blur(18px) saturate(170%)",
        }}
      >
        {(["streets", "satellite"] as Array<keyof typeof MAP_STYLE_LABELS>).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setMapStyleMode(mode)}
            style={{
              border: "1px solid rgba(186,230,253,0.22)",
              borderRadius: 999,
              background: mapStyleMode === mode ? "rgba(14,165,233,0.34)" : "rgba(15,23,42,0.36)",
              color: mapStyleMode === mode ? "#ecfeff" : "#bfdbfe",
              fontSize: 12,
              fontWeight: 800,
              padding: "7px 11px",
              cursor: "pointer",
            }}
          >
            {MAP_STYLE_LABELS[mode]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIs3DEnabled((value) => !value)}
          style={{
            border: "1px solid rgba(186,230,253,0.22)",
            borderRadius: 999,
            background: is3DEnabled ? "rgba(34,197,94,0.22)" : "rgba(71,85,105,0.36)",
            color: is3DEnabled ? "#dcfce7" : "#cbd5e1",
            fontSize: 12,
            fontWeight: 800,
            padding: "7px 11px",
            cursor: "pointer",
          }}
        >
          {is3DEnabled ? "3D On" : "2D View"}
        </button>
      </div>

      <div
        className="zone-panel"
        style={{
          position: "fixed",
          top: 14,
          right: 14,
          zIndex: 12,
          width: 280,
          maxHeight: "86vh",
          overflowY: "auto",
          background: "linear-gradient(155deg, rgba(15,23,42,0.92), rgba(30,41,59,0.84))",
          border: "1px solid rgba(148,163,184,0.35)",
          borderRadius: 14,
          padding: 12,
          color: "#e2e8f0",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 26px rgba(2,6,23,0.45)",
        }}
      >
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Civic Layers</div>
            <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{mapStatus}</div>
          </div>
          <div
            style={{
              borderRadius: 999,
              border: "1px solid rgba(34,211,238,0.28)",
              background: "rgba(8,47,73,0.42)",
              color: "#a5f3fc",
              padding: "5px 8px",
              fontSize: 11,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {reports.length} reports
          </div>
        </div>

        <label style={{ display: "grid", gap: 8, fontSize: 13 }}>
          <span>Select one zone at a time</span>
          <select
            value={selectedZone}
            onChange={(event) => setSelectedZone(event.target.value as ZoneOption)}
            style={{
              width: "100%",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#e2e8f0",
              padding: "8px 10px",
              fontSize: 13,
            }}
          >
            <option value="all">All</option>
            {ZONE_CONFIG.map((zone) => (
              <option key={zone.key} value={zone.key}>
                {zone.label}
              </option>
            ))}
          </select>
        </label>

        {selectedZone !== "all" ? (
          <>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, fontStyle: "italic" }}>
              Radius is applied automatically to matching buildings based on building size and height.
            </div>
          </>
        ) : null}

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#93c5fd" }}>Showing: {zoneLabelMap[selectedZone]}</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              padding: 8,
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(2,6,23,0.28)",
            }}
          >
            {ZONE_CONFIG.filter((zone) => selectedZone === "all" || zone.key === selectedZone).map((zone) => (
              <div key={zone.key} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: zone.color,
                    boxShadow: `0 0 12px ${zone.color}66`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#cbd5e1", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {zone.label}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                const current = userLocationRef.current;
                if (!current || !mapRef.current) {
                  setMapStatus("Allow location access to center on you.");
                  return;
                }
                mapRef.current.flyTo({ center: current, zoom: 16.4, pitch: is3DEnabled ? DEFAULT_MAP_PITCH : 0, essential: true });
                setFocusPoint(current);
              }}
              style={{
                border: "1px solid rgba(125,211,252,0.28)",
                background: "rgba(14,165,233,0.14)",
                color: "#dbeafe",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              My area
            </button>
            <button
              type="button"
              onClick={() => {
                focusPointRef.current = null;
                setFocusPoint(null);
                setSelectedZone("all");
                setNearbyInsights([]);
                if (mapRef.current) setSelectedPlaceGeometry(mapRef.current, null, "");
                markerRef.current?.remove();
                popupRef.current?.remove();
              }}
              style={{
                border: "1px solid rgba(148,163,184,0.28)",
                background: "rgba(15,23,42,0.5)",
                color: "#cbd5e1",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div
        className="search-shell"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 14,
          transform: showSearchBar ? "translateX(-50%) translateY(0) scale(1)" : "translateX(-50%) translateY(18px) scale(0.985)",
          opacity: showSearchBar ? 1 : 0,
          pointerEvents: showSearchBar ? "auto" : "none",
          zIndex: 30,
          width: "min(94vw, 900px)",
          borderRadius: 20,
          border: "1px solid rgba(186,230,253,0.24)",
          background:
            "linear-gradient(128deg, rgba(10,18,38,0.86), rgba(15,23,42,0.78) 44%, rgba(30,41,59,0.66)), radial-gradient(circle at 12% 18%, rgba(56,189,248,0.24), transparent 42%), radial-gradient(circle at 86% 2%, rgba(251,113,133,0.22), transparent 38%), radial-gradient(circle at 78% 118%, rgba(34,197,94,0.18), transparent 42%)",
          backdropFilter: "blur(22px) saturate(170%)",
          boxShadow: "0 24px 44px rgba(2,6,23,0.48), inset 0 1px 0 rgba(255,255,255,0.06)",
          padding: 10,
          display: "grid",
          gap: 8,
          transition: "opacity 260ms ease, transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1", letterSpacing: 0.45, textTransform: "uppercase" }}>
              Smart Civic Search
            </div>
            <button
              type="button"
              aria-label="Clear and close search bar"
              onClick={closeAndClearSearchBar}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: "1px solid rgba(186,230,253,0.3)",
                background: "rgba(8,47,73,0.45)",
                color: "#e2e8f0",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              x
            </button>
          </div>

          <div className="search-input-row" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              value={searchText}
              onFocus={() => {
                if (suggestions.length > 0) setDropdownOpen(true);
              }}
              onChange={(event) => {
                setSearchText(event.target.value);
                setSearchMessage("");
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Search schools, colleges, buildings, offices, landmarks, addresses, roads, cities, services..."
              style={{
                width: "100%",
                borderRadius: 10,
                border: "1px solid rgba(186,230,253,0.28)",
                background: "linear-gradient(145deg, rgba(2,6,23,0.62), rgba(15,23,42,0.5))",
                color: "#f8fafc",
                padding: "11px 12px",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              onClick={() => {
                void onSubmitSearch();
              }}
              disabled={isSearching}
              style={{
                borderRadius: 10,
                border: "1px solid rgba(186,230,253,0.42)",
                background: isSearching
                  ? "rgba(71,85,105,0.45)"
                  : "linear-gradient(135deg, rgba(6,182,212,0.36), rgba(56,189,248,0.24) 52%, rgba(244,114,182,0.26))",
                color: "#e0f2fe",
                padding: "11px 14px",
                fontSize: 14,
                fontWeight: 700,
                cursor: isSearching ? "not-allowed" : "pointer",
              }}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "#a5f3fc", padding: "0 2px" }}>
              Ranked results from Mapbox and OSM with nearby context and building highlighting.
            </div>
          </div>

          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {["hospitals near me", "schools nearby", "police station", "railway station", "garbage reports"].map((query) => (
              <button
                key={query}
                type="button"
                onClick={() => {
                  setSearchText(query);
                  setSearchMessage("");
                }}
                style={{
                  border: "1px solid rgba(186,230,253,0.18)",
                  background: "rgba(8,47,73,0.36)",
                  color: "#bae6fd",
                  borderRadius: 999,
                  padding: "6px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {query}
              </button>
            ))}
          </div>

          {dropdownOpen ? (
            <div
              className="search-dropdown"
              style={{
                borderRadius: 12,
                border: "1px solid rgba(186,230,253,0.22)",
                background: "linear-gradient(145deg, rgba(2,6,23,0.78), rgba(15,23,42,0.68))",
                maxHeight: 320,
                overflowY: "auto",
              }}
            >
              {isLoadingSuggestions ? (
                <div style={{ padding: 10, display: "grid", gap: 8 }}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div
                      key={`skeleton-${idx}`}
                      style={{
                        height: 52,
                        borderRadius: 8,
                        background: "linear-gradient(90deg, rgba(30,41,59,0.5), rgba(51,65,85,0.7), rgba(30,41,59,0.5))",
                        backgroundSize: "200% 100%",
                        animation: "pulse 1.2s ease-in-out infinite",
                      }}
                    />
                  ))}
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      void applySearchSelection(item);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      borderBottom: "1px solid rgba(186,230,253,0.14)",
                      background: activeSuggestionIndex === index ? "rgba(14,165,233,0.2)" : "transparent",
                      color: "#e2e8f0",
                      padding: "10px 12px",
                      cursor: "pointer",
                      display: "grid",
                      gridTemplateColumns: "92px 1fr",
                      gap: 10,
                    }}
                  >
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      loading="lazy"
                      style={{
                        width: 92,
                        height: 66,
                        borderRadius: 8,
                        objectFit: "cover",
                        background: "rgba(51,65,85,0.6)",
                      }}
                    />
                    <div style={{ display: "grid", gap: 3 }}>
                      <div style={{ fontSize: 14, fontWeight: 650 }}>{highlightText(item.name, searchText)}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{highlightText(item.fullName, searchText)}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11, color: "#bae6fd", alignItems: "center" }}>
                        <span>{item.typeLabel}</span>
                        <span>{formatDistance(item.distanceKm)}</span>
                        <span>{item.precision === "exact" ? "Exact location" : "Approximate area"}</span>
                        <span>{item.confidenceLabel}</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div style={{ padding: "12px 14px", fontSize: 13, color: "#cbd5e1" }}>
                  No results found. Try a broader query like locality or city.
                </div>
              )}
            </div>
          ) : null}
      </div>

      <button
        type="button"
        aria-label="Open search"
        onClick={() => setShowSearchBar(true)}
        style={{
          position: "fixed",
          left: 14,
          bottom: 14,
          zIndex: 31,
          minWidth: 74,
          height: 48,
          borderRadius: 999,
          border: "1px solid rgba(186,230,253,0.3)",
          background:
            "linear-gradient(145deg, rgba(10,18,38,0.8), rgba(15,23,42,0.66)), radial-gradient(circle at 18% 12%, rgba(56,189,248,0.22), transparent 45%), radial-gradient(circle at 82% 88%, rgba(244,114,182,0.2), transparent 40%)",
          color: "#e2e8f0",
          fontSize: 13,
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 16px 30px rgba(2,6,23,0.44), inset 0 1px 0 rgba(255,255,255,0.08)",
          backdropFilter: "blur(16px) saturate(180%)",
          opacity: showSearchBar ? 0 : 1,
          transform: showSearchBar ? "translateY(10px) scale(0.92)" : "translateY(0) scale(1)",
          pointerEvents: showSearchBar ? "none" : "auto",
          transition: "opacity 220ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        Search
      </button>

      <button
        type="button"
        aria-label="Open report assistant"
        onClick={() => {
          openReportChat();
        }}
        style={{
          position: "fixed",
          left: 14,
          bottom: showSearchBar ? 74 : 74,
          zIndex: 31,
          minWidth: 112,
          height: 44,
          borderRadius: 999,
          border: "1px solid rgba(254,205,211,0.45)",
          background:
            "linear-gradient(145deg, rgba(76,5,25,0.8), rgba(127,29,29,0.72)), radial-gradient(circle at 12% 14%, rgba(251,113,133,0.35), transparent 44%)",
          color: "#ffe4e6",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 16px 30px rgba(69,10,10,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
          backdropFilter: "blur(14px) saturate(170%)",
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12, lineHeight: 1, fontWeight: 900 }}>!</span>
        Report
      </button>

      <div
        className="quick-report-rail"
        style={{
          position: "fixed",
          left: 14,
          bottom: showSearchBar ? 126 : 126,
          zIndex: 31,
          display: "grid",
          gap: 7,
        }}
      >
        {QUICK_REPORT_TYPES.slice(0, 4).map((type) => {
          const meta = getReportMeta(type);
          return (
            <button
              key={type}
              type="button"
              title={`Report ${meta.label}`}
              onClick={() => openReportChat(type)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                border: `1px solid ${meta.color}88`,
                background: `linear-gradient(145deg, ${meta.color}66, rgba(15,23,42,0.72))`,
                color: "#fff",
                fontSize: 11,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 12px 26px rgba(2,6,23,0.42)",
                backdropFilter: "blur(12px)",
              }}
            >
              {getReportMarkerLabel(type)}
            </button>
          );
        })}
      </div>

      {isReportChatOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(2,6,23,0.66)",
            backdropFilter: "blur(12px)",
            display: "grid",
            placeItems: "center",
            padding: 14,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Citizen Report Assistant"
            style={{
              width: "min(96vw, 720px)",
              maxHeight: "88vh",
              overflow: "hidden",
              display: "grid",
              gridTemplateRows: "auto auto 1fr auto",
              gap: 12,
              borderRadius: 22,
              border: "1px solid rgba(251,113,133,0.28)",
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.92)), radial-gradient(circle at 12% 8%, rgba(251,113,133,0.16), transparent 34%), radial-gradient(circle at 88% 0%, rgba(56,189,248,0.12), transparent 26%)",
              boxShadow: "0 30px 80px rgba(2,6,23,0.68)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ color: "#ffe4e6", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>
                    Citizen Report Assistant
                  </div>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(125,211,252,0.25)",
                      background: "rgba(14,165,233,0.12)",
                      color: "#bae6fd",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    AI verified
                  </span>
                </div>
                <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.5, maxWidth: 540 }}>
                  Describe the issue, upload a photo if you have one, and we&apos;ll detect the problem, confirm the details, and help you pin the exact location.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportChatOpen(false)}
                aria-label="Close report assistant"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  border: "1px solid rgba(251,113,133,0.28)",
                  background: "rgba(127,29,29,0.42)",
                  color: "#ffe4e6",
                  cursor: "pointer",
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {QUICK_REPORT_TYPES.map((type) => {
                const meta = getReportMeta(type);
                const isActive = reportDraft.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setReportDraft((previous) => ({ ...previous, type, title: previous.title ?? `${meta.label} Report` }));
                      setReportInput((previous) => previous || `${meta.label} issue near `);
                      setReportReadyToSubmit(false);
                    }}
                    style={{
                      borderRadius: 999,
                      border: `1px solid ${isActive ? meta.color : "rgba(251,113,133,0.28)"}`,
                      background: isActive ? `${meta.color}33` : "rgba(127,29,29,0.18)",
                      color: isActive ? "#fff" : "#fecdd3",
                      padding: "6px 9px",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 10,
              }}
            >
              {[
                { label: "Capture", value: reportImagePreview ? "Photo attached" : "Add evidence" },
                { label: "Review", value: reportMessages.length > 1 ? `${reportMessages.length} messages` : "Starting draft" },
                {
                  label: "Status",
                  value: reportReadyToSubmit ? "Ready to submit" : "Needs verification",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(148,163,184,0.16)",
                    background: "rgba(15,23,42,0.65)",
                    padding: "10px 12px",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {item.label}
                  </div>
                  <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 700 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                overflowY: "auto",
                borderRadius: 18,
                border: "1px solid rgba(148,163,184,0.2)",
                background: "rgba(2,6,23,0.28)",
                padding: 14,
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ color: "#cbd5e1", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Conversation
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    alignContent: "start",
                  }}
                >
                  {reportMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      style={{
                        justifySelf: message.role === "user" ? "end" : "start",
                        maxWidth: "92%",
                        borderRadius: message.role === "user" ? "16px 16px 6px 16px" : "16px 16px 16px 6px",
                        padding: "10px 12px",
                        background:
                          message.role === "user"
                            ? "linear-gradient(145deg, rgba(190,24,93,0.3), rgba(190,24,93,0.18))"
                            : "linear-gradient(145deg, rgba(30,64,175,0.24), rgba(56,189,248,0.14))",
                        border:
                          message.role === "user"
                            ? "1px solid rgba(251,113,133,0.22)"
                            : "1px solid rgba(125,211,252,0.22)",
                        color: "#f8fafc",
                        fontSize: 13,
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.55,
                        boxShadow: "0 10px 18px rgba(2,6,23,0.2)",
                      }}
                    >
                      {message.text}
                    </div>
                  ))}
                  {isReportThinking ? (
                    <div style={{ color: "#94a3b8", fontSize: 12, paddingLeft: 4 }}>Thinking about the report...</div>
                  ) : null}
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>Evidence</div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>Photo detection fills in the report automatically.</div>
                  </div>
                  {reportImagePreview ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReportImagePreview(null);
                        setDetectionMessage(null);
                      }}
                      style={{
                        borderRadius: 999,
                        border: "1px solid rgba(248,113,113,0.3)",
                        background: "rgba(239,68,68,0.16)",
                        color: "#fecaca",
                        padding: "7px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Clear photo
                    </button>
                  ) : null}
                </div>

                {reportImagePreview ? (
                  <div
                    style={{
                      borderRadius: 18,
                      overflow: "hidden",
                      border: "1px solid rgba(251,113,133,0.24)",
                      background: "rgba(15,23,42,0.7)",
                    }}
                  >
                    <img
                      src={reportImagePreview}
                      alt="Selected"
                      style={{ width: "100%", height: "auto", display: "block", maxHeight: 260, objectFit: "cover" }}
                    />
                    <div style={{ display: "grid", gap: 8, padding: 12 }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          width: "fit-content",
                          borderRadius: 999,
                          border: "1px solid rgba(251,113,133,0.24)",
                          background: "rgba(190,24,93,0.12)",
                          color: "#ffe4e6",
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {isDetectingIssue ? "Detecting issue..." : detectionMessage || "Issue detected"}
                      </div>
                      <div style={{ color: "#cbd5e1", fontSize: 12, lineHeight: 1.5 }}>
                        If the category looks wrong, remove the image and try another photo. The report details will update after detection.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      borderRadius: 18,
                      border: "1px solid rgba(148,163,184,0.2)",
                      background: "rgba(15,23,42,0.7)",
                      padding: 12,
                    }}
                  >
                    <ImageUpload
                      onImageSelected={handleDetectIssueFromImage}
                      onDetecting={setIsDetectingIssue}
                      disabled={isReportThinking || isDetectingIssue}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>Report details</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 10,
                  }}
                >
                  {[
                    { label: "Detected type", value: reportDraft.type ? getReportMeta(reportDraft.type).label : "Not detected yet" },
                    {
                      label: "Location",
                      value: hasExactReportLocation(reportDraft.location)
                        ? `${reportDraft.location?.lat?.toFixed(5)}, ${reportDraft.location?.lng?.toFixed(5)}`
                        : reportDraft.location?.address ?? "Pending",
                    },
                    {
                      label: "Impact radius",
                      value:
                        typeof reportDraft.impactRadiusKm === "number"
                          ? `${reportDraft.impactRadiusKm.toFixed(2)} km`
                          : "Point issue",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        borderRadius: 16,
                        border: "1px solid rgba(148,163,184,0.18)",
                        background: "rgba(15,23,42,0.72)",
                        padding: "12px 13px",
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {item.label}
                      </div>
                      <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIsReportLocationPickerOpen(true)}
                  style={{
                    justifySelf: "start",
                    borderRadius: 999,
                    border: "1px solid rgba(251,113,133,0.32)",
                    background: "rgba(190,24,93,0.16)",
                    color: "#ffe4e6",
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 10px 18px rgba(190,24,93,0.12)",
                  }}
                >
                  {hasExactReportLocation(reportDraft.location) ? "Adjust pin on map" : "Open map to pin location"}
                </button>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>Add context</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "stretch" }}>
                  <input
                    value={reportInput}
                    onChange={(event) => setReportInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void sendReportMessage();
                      }
                    }}
                    placeholder="Describe severity, landmark, and how far the damage spreads..."
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(148,163,184,0.24)",
                      background: "rgba(2,6,23,0.62)",
                      color: "#f8fafc",
                      padding: "12px 14px",
                      fontSize: 13,
                      outline: "none",
                      minWidth: 0,
                    }}
                  />
                  <button
                    type="button"
                    disabled={isReportThinking}
                    onClick={() => {
                      void sendReportMessage();
                    }}
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(251,113,133,0.3)",
                      background: "linear-gradient(145deg, rgba(190,24,93,0.5), rgba(127,29,29,0.65))",
                      color: "#ffe4e6",
                      fontWeight: 800,
                      fontSize: 13,
                      padding: "0 18px",
                      cursor: isReportThinking ? "not-allowed" : "pointer",
                      opacity: isReportThinking ? 0.72 : 1,
                      minHeight: 46,
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                borderTop: "1px solid rgba(148,163,184,0.16)",
                paddingTop: 4,
              }}
            >
              <div style={{ display: "grid", gap: 3 }}>
                <span style={{ fontSize: 12, color: reportReadyToSubmit ? "#86efac" : "#fcd34d", fontWeight: 700 }}>
                  {reportReadyToSubmit ? "Verified and ready to submit." : "Share enough detail for AI verification."}
                </span>
                {reportStatusMessage ? <span style={{ fontSize: 12, color: "#fcd34d" }}>{reportStatusMessage}</span> : null}
              </div>
              <button
                type="button"
                disabled={!reportReadyToSubmit || isSubmittingReport}
                onClick={() => {
                  void submitVerifiedReport();
                }}
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(134,239,172,0.34)",
                  background: "linear-gradient(145deg, rgba(22,163,74,0.44), rgba(21,128,61,0.58))",
                  color: "#dcfce7",
                  fontWeight: 800,
                  fontSize: 13,
                  padding: "12px 16px",
                  cursor: !reportReadyToSubmit || isSubmittingReport ? "not-allowed" : "pointer",
                  opacity: !reportReadyToSubmit || isSubmittingReport ? 0.6 : 1,
                  minWidth: 160,
                }}
              >
                {isSubmittingReport ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isReportLocationPickerOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 81,
            background: "rgba(2,6,23,0.68)",
            backdropFilter: "blur(12px)",
            display: "grid",
            placeItems: "center",
            padding: 14,
          }}
        >
          <div
            style={{
              width: "min(96vw, 920px)",
              maxHeight: "90vh",
              overflow: "hidden",
              borderRadius: 22,
              border: "1px solid rgba(251,113,133,0.28)",
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.94)), radial-gradient(circle at 10% 8%, rgba(251,113,133,0.16), transparent 34%)",
              boxShadow: "0 30px 80px rgba(2,6,23,0.68)",
              padding: 16,
              display: "grid",
              gridTemplateRows: "auto 1fr auto",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ color: "#ffe4e6", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>
                  Pin the exact location
                </div>
                <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.5, maxWidth: 560 }}>
                  Tap the map where the issue is happening. We&apos;ll use this pin to anchor the report and its impact radius.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportLocationPickerOpen(false)}
                aria-label="Close location picker"
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(251,113,133,0.28)",
                  background: "rgba(127,29,29,0.42)",
                  color: "#ffe4e6",
                  cursor: "pointer",
                  padding: "8px 12px",
                  fontWeight: 700,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                borderRadius: 18,
                overflow: "hidden",
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(15,23,42,0.66)",
              }}
            >
              <div style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ color: "#cbd5e1", fontSize: 12 }}>Click once to drop the pin, then fine-tune the report below.</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  {hasExactReportLocation(reportDraft.location)
                    ? `Selected: ${reportDraft.location?.lat?.toFixed(5)}, ${reportDraft.location?.lng?.toFixed(5)}`
                    : "No pin yet"}
                </div>
              </div>
              <div style={{ minHeight: 420 }}>
                <div ref={reportLocationMapContainerRef} style={{ width: "100%", height: "100%", minHeight: 420 }} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ color: "#cbd5e1", fontSize: 12 }}>
                {hasExactReportLocation(reportDraft.location)
                  ? "Use this location to keep the report precise."
                  : "Zoom or pan the map if needed, then set the pin."}
              </div>
              <button
                type="button"
                onClick={() => setIsReportLocationPickerOpen(false)}
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(134,239,172,0.34)",
                  background: "linear-gradient(145deg, rgba(22,163,74,0.44), rgba(21,128,61,0.58))",
                  color: "#dcfce7",
                  fontWeight: 800,
                  fontSize: 13,
                  padding: "10px 14px",
                  cursor: "pointer",
                }}
              >
                Use this pin
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {nearbyInsights.length > 0 ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: showSearchBar ? 266 : 64,
            transform: "translateX(-50%)",
            zIndex: 35,
            borderRadius: 10,
            background: "rgba(15,23,42,0.82)",
            border: "1px solid rgba(148,163,184,0.35)",
            color: "#dbeafe",
            padding: "8px 12px",
            fontSize: 12,
            maxWidth: "min(92vw, 860px)",
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Nearby intelligence: {nearbyInsights.slice(0, 6).join(" • ")}</span>
          <button
            type="button"
            onClick={() => setNearbyInsights([])}
            aria-label="Dismiss nearby insights"
            style={{
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(15,23,42,0.8)",
              color: "#e2e8f0",
              borderRadius: 999,
              width: 22,
              height: 22,
              cursor: "pointer",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            x
          </button>
        </div>
      ) : null}

      {searchMessage ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: showSearchBar ? 232 : 64,
            transform: "translateX(-50%)",
            zIndex: 35,
            borderRadius: 10,
            background: "rgba(15,23,42,0.78)",
            border: "1px solid rgba(148,163,184,0.35)",
            color: "#dbeafe",
            padding: "8px 12px",
            fontSize: 12,
            maxWidth: "min(92vw, 860px)",
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{searchMessage}</span>
          <button
            type="button"
            onClick={() => setSearchMessage("")}
            aria-label="Dismiss search message"
            style={{
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(15,23,42,0.8)",
              color: "#e2e8f0",
              borderRadius: 999,
              width: 22,
              height: 22,
              cursor: "pointer",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            x
          </button>
        </div>
      ) : null}

      <style>{`
        .mapboxgl-ctrl-bottom-left,
        .mapboxgl-ctrl-bottom-right {
          margin-bottom: 106px;
        }

        .map-command-bar {
          border-radius: 999px !important;
          border: 1px solid rgba(125,211,252,0.18) !important;
          background: linear-gradient(135deg, rgba(6,11,23,0.74), rgba(15,23,42,0.58)) !important;
          box-shadow: 0 18px 44px rgba(2,6,23,0.46), inset 0 1px 0 rgba(255,255,255,0.08) !important;
          backdrop-filter: blur(22px) saturate(180%) !important;
        }

        .mapboxgl-ctrl-group {
          overflow: hidden;
          border: 1px solid rgba(125,211,252,0.18) !important;
          border-radius: 14px !important;
          background: rgba(8,15,31,0.74) !important;
          box-shadow: 0 18px 38px rgba(2,6,23,0.45) !important;
          backdrop-filter: blur(18px) saturate(175%);
        }

        .mapboxgl-ctrl-group button {
          filter: invert(1) hue-rotate(175deg) saturate(0.85);
        }

        .mapboxgl-popup-content {
          border-radius: 16px;
          border: 1px solid rgba(125,211,252,0.15);
          box-shadow: 0 22px 52px rgba(2,6,23,0.38);
          background: rgba(10,18,38,0.94);
          color: #e2e8f0;
        }

        .zone-panel {
          border-radius: 18px !important;
          border: 1px solid rgba(125,211,252,0.16) !important;
          background: linear-gradient(155deg, rgba(7,15,28,0.88), rgba(15,23,42,0.78)) !important;
          box-shadow: 0 22px 54px rgba(2,6,23,0.5), inset 0 1px 0 rgba(255,255,255,0.05) !important;
          backdrop-filter: blur(20px) saturate(170%) !important;
        }

        .search-shell {
          border-radius: 24px !important;
          border: 1px solid rgba(125,211,252,0.18) !important;
          box-shadow: 0 30px 64px rgba(2,6,23,0.52), inset 0 1px 0 rgba(255,255,255,0.06) !important;
        }

        .quick-report-rail button {
          box-shadow: 0 12px 28px rgba(2,6,23,0.42);
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
        }

        .quick-report-rail button:hover,
        .quick-report-rail button:focus-visible {
          transform: translateY(-1px) scale(1.03);
          box-shadow: 0 16px 32px rgba(2,6,23,0.5);
        }

        @media (max-width: 1024px) {
          .zone-panel {
            width: 244px;
            top: 10px;
            right: 10px;
          }

          .search-shell {
            width: min(96vw, 760px);
          }

          .map-command-bar {
            top: 60px;
          }
        }

        @media (max-width: 768px) {
          .zone-panel {
            left: 10px;
            right: 10px;
            width: auto;
            top: 108px;
            max-height: 34vh;
          }

          .search-shell {
            width: calc(100vw - 20px);
            bottom: 10px;
            padding: 10px;
          }

          .map-command-bar {
            top: 58px;
            width: calc(100vw - 20px);
            justify-content: center;
            border-radius: 12px;
          }

          .quick-report-rail {
            display: none !important;
          }

          .search-input-row {
            grid-template-columns: 1fr;
          }

          .search-dropdown {
            max-height: 220px;
          }

          .mapboxgl-ctrl-bottom-left,
          .mapboxgl-ctrl-bottom-right {
            margin-bottom: 178px;
          }
        }

        @keyframes pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}
