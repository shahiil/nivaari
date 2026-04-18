"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import mapboxgl from "mapbox-gl";
// @ts-ignore
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
    buildingKeywords: ["commercial", "retail", "office", "business", "mall", "store"],
    poiKeywords: ["commercial", "retail", "shop", "office", "mall", "store", "business", "market"],
    color: "#2563eb",
  },
  {
    key: "agriculture",
    label: "Agriculture",
    buildingKeywords: ["farm", "farmland", "agricultural", "greenhouse", "barn", "agri"],
    poiKeywords: ["farm", "farmland", "agriculture", "agri", "greenhouse", "barn"],
    color: "#facc15",
  },
  {
    key: "educational",
    label: "Educational",
    buildingKeywords: ["school", "college", "university", "kindergarten", "education", "library", "campus"],
    poiKeywords: ["school", "college", "university", "kindergarten", "education", "library", "campus"],
    color: "#92400e",
  },
  {
    key: "residential",
    label: "Residential",
    buildingKeywords: ["residential", "apartment", "house", "housing", "home", "villa", "residence"],
    poiKeywords: ["residential", "housing", "apartment", "home", "residence", "neighborhood"],
    color: "#22c55e",
  },
  {
    key: "industrial",
    label: "Industrial",
    buildingKeywords: ["industrial", "factory", "manufacture", "warehouse", "plant", "workshop"],
    poiKeywords: ["industrial", "factory", "warehouse", "plant", "workshop"],
    color: "#111827",
  },
  {
    key: "health",
    label: "Health",
    buildingKeywords: ["hospital", "clinic", "doctors", "healthcare", "medical", "emergency"],
    poiKeywords: ["hospital", "clinic", "doctor", "health", "medical", "pharmacy", "emergency"],
    color: "#dc2626",
  },
  {
    key: "railway_station",
    label: "Railway Station",
    buildingKeywords: ["railway", "station", "train", "platform", "rail", "transit"],
    poiKeywords: ["railway", "train", "station", "platform", "transit", "train_station"],
    color: "#8b5cf6",
  },
  {
    key: "food",
    label: "Food",
    buildingKeywords: ["food", "restaurant", "fast_food", "cafe", "bar", "pub", "eatery", "bakery"],
    poiKeywords: ["food_and_drink", "restaurant", "fast_food", "cafe", "coffee", "bakery", "bar", "pub"],
    color: "#f97316",
  },
  {
    key: "hotel",
    label: "Hotel",
    buildingKeywords: ["hotel", "hostel", "guest_house", "motel", "resort", "lodging"],
    poiKeywords: ["hotel", "hostel", "guest_house", "motel", "resort", "lodging"],
    color: "#3b82f6",
  },
  {
    key: "entertainment",
    label: "Entertainment",
    buildingKeywords: ["entertainment", "cinema", "theatre", "stadium", "museum", "park"],
    poiKeywords: ["entertainment", "cinema", "theatre", "stadium", "museum", "park", "attraction"],
    color: "#ec4899",
  },
];

const BUILDING_LAYER_ID = "3d-buildings";
const ZONE_POI_LABEL_LAYER_ID = "zone-poi-labels";
const RADIUS_SOURCE_ID = "zone-radius-source";
const RADIUS_FILL_LAYER_ID = "zone-radius-fill";
const RADIUS_OUTLINE_LAYER_ID = "zone-radius-outline";
const SELECTED_PLACE_SOURCE_ID = "selected-place-source";
const SELECTED_PLACE_FILL_LAYER_ID = "selected-place-fill";
const SELECTED_PLACE_LINE_LAYER_ID = "selected-place-line";
const DEFAULT_MAP_PITCH = 60;
const DEFAULT_MAP_BEARING = -17.6;
const MIN_3D_ZOOM = 14;
const STREETS_STYLE = "mapbox://styles/mapbox/streets-v12";
const DEFAULT_RADIUS_KM = 0.2;
const RADIUS_VISIBILITY_MIN_ZOOM = 17;
const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_CACHE_TTL_MS = 4 * 60 * 1000;
const RECENT_SEARCHES_KEY = "nivaari-recent-searches-v2";
const MAX_RECENT_SEARCHES = 8;
const MIN_CONFIDENCE_DEFAULT = 0.45;

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

const buildStaticPreviewImage = (center: LngLatTuple, token: string) =>
  token
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+2563eb(${center[0]},${center[1]})/${center[0]},${center[1]},15/280x160?access_token=${token}`
    : undefined;

const getMapClassExpression = (): mapboxgl.ExpressionSpecification =>
  [
    "downcase",
    ["coalesce", ["get", "class"], ["get", "type"], ["get", "subclass"], ["get", "category"], ""],
  ] as mapboxgl.ExpressionSpecification;

const getBuildingSearchTextExpression = (): mapboxgl.ExpressionSpecification =>
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
      ["coalesce", ["get", "name"], ""],
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

const buildRadiusFeature = (center: LngLatTuple, radiusKm: number, steps = 96): GeoJSON.FeatureCollection => {
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
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
      },
    ],
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

const getBuildingColorExpression = (selectedZone: ZoneOption): mapboxgl.ExpressionSpecification => {
  if (selectedZone === "all") {
    return [
      "match",
      getMapClassExpression(),
      ["residential", "apartments", "house", "housing"],
      "#22c55e",
      ["commercial", "retail", "office"],
      "#2563eb",
      ["entertainment", "cinema", "theatre", "stadium", "arts_centre"],
      "#ec4899",
      ["restaurant", "fast_food", "cafe", "food_court", "bar", "pub"],
      "#f97316",
      ["hospital", "clinic", "fire_station", "police", "emergency"],
      "#dc2626",
      ["industrial", "factory", "manufacture", "warehouse"],
      "#111827",
      ["school", "college", "university", "kindergarten", "education", "library"],
      "#92400e",
      ["farm", "farmland", "agricultural", "greenhouse", "barn"],
      "#facc15",
      "#9ca3af",
    ] as mapboxgl.ExpressionSpecification;
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

const addOrUpdateZoneLayers = (
  map: mapboxgl.Map,
  selectedZone: ZoneOption,
  radiusCenter: LngLatTuple,
  radiusKm: number,
) => {
  if (!map.isStyleLoaded()) return;

  if (selectedZone === "all") {
    if (map.getLayer(RADIUS_FILL_LAYER_ID)) map.removeLayer(RADIUS_FILL_LAYER_ID);
    if (map.getLayer(RADIUS_OUTLINE_LAYER_ID)) map.removeLayer(RADIUS_OUTLINE_LAYER_ID);
    if (map.getSource(RADIUS_SOURCE_ID)) map.removeSource(RADIUS_SOURCE_ID);
  } else {
    const radiusFeature = buildRadiusFeature(radiusCenter, radiusKm);

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
        paint: {
          "fill-color": "#06b6d4",
          "fill-opacity": 0.25,
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
          "line-color": "#0891b2",
          "line-width": 3.5,
          "line-opacity": 1,
        },
      });
    }
  }

  const layers = map.getStyle()?.layers;
  if (!layers) return;

  const labelLayer = layers.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"])?.id;

  if (map.getLayer(BUILDING_LAYER_ID)) {
    map.setFilter(BUILDING_LAYER_ID, buildZoneFilterExpression(selectedZone));
    map.setPaintProperty(BUILDING_LAYER_ID, "fill-extrusion-color", getBuildingColorExpression(selectedZone));
    map.setPaintProperty(BUILDING_LAYER_ID, "fill-extrusion-opacity", 0.88);
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
        filter: buildZoneFilterExpression(selectedZone),
        type: "fill-extrusion",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": getBuildingColorExpression(selectedZone),
          "fill-extrusion-height": ["coalesce", ["get", "height"], ["get", "render_height"], 10],
          "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
          "fill-extrusion-opacity": 0.88,
        },
      },
      labelLayer,
    );
  }

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

export default function HomePage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const userLocationRef = useRef<LngLatTuple | null>(null);
  const selectedZoneRef = useRef<ZoneOption>("all");
  const focusPointRef = useRef<LngLatTuple | null>(null);
  const radiusKmRef = useRef(DEFAULT_RADIUS_KM);
  const cacheRef = useRef<Map<string, { ts: number; items: UniversalSuggestion[] }>>(new Map());

  const [selectedZone, setSelectedZone] = useState<ZoneOption>("all");
  const [focusPoint, setFocusPoint] = useState<LngLatTuple | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);

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
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: STREETS_STYLE,
      center: [72.8777, 19.076],
      zoom: 15,
      pitch: DEFAULT_MAP_PITCH,
      bearing: DEFAULT_MAP_BEARING,
      antialias: true,
    });

    mapRef.current = map;

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
      if (map.getPitch() < DEFAULT_MAP_PITCH) map.setPitch(DEFAULT_MAP_PITCH);
      if (map.getBearing() !== DEFAULT_MAP_BEARING) map.setBearing(DEFAULT_MAP_BEARING);
      if (map.getZoom() < MIN_3D_ZOOM) map.setZoom(15);

      ensureSelectedPlaceLayers(map);
      const center = getActiveRadiusCenter(map);
      addOrUpdateZoneLayers(map, selectedZoneRef.current, center, radiusKmRef.current);
    });

    map.on("click", (event) => {
      if (selectedZoneRef.current !== "all") {
        const clicked: LngLatTuple = [event.lngLat.lng, event.lngLat.lat];
        focusPointRef.current = clicked;
        setFocusPoint(clicked);
      }
    });

    return () => {
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
    const center = getActiveRadiusCenter(map);
    addOrUpdateZoneLayers(map, selectedZone, center, radiusKmRef.current);
  }, [selectedZone]);

  useEffect(() => {
    focusPointRef.current = focusPoint;
    const map = mapRef.current;
    if (!map) return;
    const center = getActiveRadiusCenter(map);
    addOrUpdateZoneLayers(map, selectedZoneRef.current, center, radiusKmRef.current);
  }, [focusPoint]);

  useEffect(() => {
    radiusKmRef.current = radiusKm;
    const map = mapRef.current;
    if (!map) return;
    const center = getActiveRadiusCenter(map);
    addOrUpdateZoneLayers(map, selectedZoneRef.current, center, radiusKm);
  }, [radiusKm]);

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
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Zone Filters</div>

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
            <label style={{ display: "grid", gap: 8, fontSize: 13, marginTop: 12 }}>
              <span>Radius: {radiusKm.toFixed(2)} km ({(radiusKm * 1000).toFixed(0)}m)</span>
              <input
                type="range"
                min={0.1}
                max={0.5}
                step={0.1}
                value={radiusKm}
                onChange={(event) => setRadiusKm(Number(event.target.value))}
              />
            </label>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, fontStyle: "italic" }}>
              Click on map to center the radius.
            </div>
          </>
        ) : null}

        <div style={{ marginTop: 10, fontSize: 12, color: "#93c5fd" }}>Showing: {zoneLabelMap[selectedZone]}</div>
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
              Universal Intelligent Search
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
              Dynamic query understanding, multi-source validation, and confidence-ranked results.
            </div>
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
          width: 48,
          height: 48,
          borderRadius: 999,
          border: "1px solid rgba(186,230,253,0.3)",
          background:
            "linear-gradient(145deg, rgba(10,18,38,0.8), rgba(15,23,42,0.66)), radial-gradient(circle at 18% 12%, rgba(56,189,248,0.22), transparent 45%), radial-gradient(circle at 82% 88%, rgba(244,114,182,0.2), transparent 40%)",
          color: "#e2e8f0",
          fontSize: 21,
          cursor: "pointer",
          boxShadow: "0 16px 30px rgba(2,6,23,0.44), inset 0 1px 0 rgba(255,255,255,0.08)",
          backdropFilter: "blur(16px) saturate(180%)",
          opacity: showSearchBar ? 0 : 1,
          transform: showSearchBar ? "translateY(10px) scale(0.92)" : "translateY(0) scale(1)",
          pointerEvents: showSearchBar ? "none" : "auto",
          transition: "opacity 220ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        🔍
      </button>

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

        @media (max-width: 1024px) {
          .zone-panel {
            width: 244px;
            top: 10px;
            right: 10px;
          }

          .search-shell {
            width: min(96vw, 760px);
          }
        }

        @media (max-width: 768px) {
          .zone-panel {
            left: 10px;
            right: 10px;
            width: auto;
            top: 10px;
          }

          .search-shell {
            width: calc(100vw - 20px);
            bottom: 10px;
            padding: 10px;
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
