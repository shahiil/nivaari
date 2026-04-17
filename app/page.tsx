"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

type ZoneKey =
  | "commercial"
  | "agriculture"
  | "educational"
  | "residential"
  | "industrial"
  | "health"
  | "police"
  | "food"
  | "hotel"
  | "entertainment";

type ZoneOption = "all" | ZoneKey;
type LngLatTuple = [number, number];

interface GeocodeSuggestion {
  id: string;
  placeName: string;
  center: LngLatTuple;
}

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
    buildingKeywords: [
      "residential",
      "apartment",
      "apartments",
      "house",
      "housing",
      "home",
      "villa",
      "bungalow",
      "residence",
    ],
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
    key: "police",
    label: "Police",
    buildingKeywords: ["police", "fire_station", "station", "law", "security", "emergency"],
    poiKeywords: ["police", "fire_station", "station", "security", "government", "law"],
    color: "#dc2626",
  },
  {
    key: "food",
    label: "Food",
    buildingKeywords: [
      "food",
      "restaurant",
      "fast_food",
      "cafe",
      "food_court",
      "bar",
      "pub",
      "eatery",
      "diner",
      "bakery",
      "kitchen",
      "meal",
      "coffee",
      "tea",
      "sweet",
      "sweets",
      "snack",
      "juice",
      "dessert",
    ],
    poiKeywords: [
      "food_and_drink",
      "restaurant",
      "fast_food",
      "cafe",
      "coffee",
      "tea",
      "bakery",
      "bar",
      "pub",
      "eatery",
      "diner",
      "sweet",
      "sweets",
      "snack",
      "juice",
      "dessert",
      "starbucks",
    ],
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
    buildingKeywords: ["entertainment", "cinema", "theatre", "stadium", "arts_centre", "museum", "park"],
    poiKeywords: ["entertainment", "cinema", "theatre", "stadium", "arts", "museum", "park", "attraction"],
    color: "#ec4899",
  },
];

const BUILDING_LAYER_ID = "3d-buildings";
const ZONE_POI_LABEL_LAYER_ID = "zone-poi-labels";
const RADIUS_SOURCE_ID = "zone-radius-source";
const RADIUS_FILL_LAYER_ID = "zone-radius-fill";
const RADIUS_OUTLINE_LAYER_ID = "zone-radius-outline";
const DEFAULT_MAP_PITCH = 60;
const DEFAULT_MAP_BEARING = -17.6;
const MIN_3D_ZOOM = 14;
const STREETS_STYLE = "mapbox://styles/mapbox/streets-v12";
const DEFAULT_RADIUS_KM = 0.2;
const RADIUS_VISIBILITY_MIN_ZOOM = 17;

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

const buildZoneFilterExpression = (
  selectedZone: ZoneOption,
): mapboxgl.FilterSpecification => {
  const baseExtrudeExpression: mapboxgl.ExpressionSpecification = [
    "any",
    ["==", ["get", "extrude"], "true"],
    [">", ["coalesce", ["get", "height"], ["get", "render_height"], 0], 0],
  ];

  if (selectedZone === "all") {
    return baseExtrudeExpression as mapboxgl.FilterSpecification;
  }

  const keywords = ZONE_CONFIG.find((zone) => zone.key === selectedZone)?.buildingKeywords ?? [];
  return [
    "all",
    baseExtrudeExpression,
    buildKeywordMatchExpression(getBuildingSearchTextExpression(), keywords),
  ] as mapboxgl.FilterSpecification;
};

const buildPoiLabelFilterExpression = (
  selectedZone: ZoneOption,
): mapboxgl.FilterSpecification => {
  if (selectedZone === "all") {
    return ["==", ["literal", 1], ["literal", 0]] as mapboxgl.FilterSpecification;
  }

  const keywords = ZONE_CONFIG.find((zone) => zone.key === selectedZone)?.poiKeywords ?? [];
  return [
    "all",
    buildKeywordMatchExpression(getPoiSearchTextExpression(), keywords),
  ] as mapboxgl.FilterSpecification;
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
    console.log("Building radius feature for", radiusKm, "km");
    
    // Ensure source exists
    let radiusSource = map.getSource(RADIUS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!radiusSource) {
      console.log("Creating new radius source");
      try {
        map.addSource(RADIUS_SOURCE_ID, {
          type: "geojson",
          data: radiusFeature as any,
        });
        radiusSource = map.getSource(RADIUS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      } catch (e) {
        console.error("Error creating radius source:", e);
        return;
      }
    } else {
      console.log("Updating existing radius source");
      try {
        radiusSource.setData(radiusFeature as any);
      } catch (e) {
        console.error("Error updating radius source data:", e);
      }
    }

    // Add fill layer if it doesn't exist
    if (!map.getLayer(RADIUS_FILL_LAYER_ID)) {
      console.log("Adding radius fill layer");
      try {
        map.addLayer(
          {
            id: RADIUS_FILL_LAYER_ID,
            type: "fill",
            source: RADIUS_SOURCE_ID,
            minzoom: RADIUS_VISIBILITY_MIN_ZOOM,
            paint: {
              "fill-color": "#06b6d4",
              "fill-opacity": 0.25,
            },
          },
          undefined,
        );
      } catch (e) {
        console.error("Error adding radius fill layer:", e);
      }
    }

    // Add outline layer if it doesn't exist
    if (!map.getLayer(RADIUS_OUTLINE_LAYER_ID)) {
      console.log("Adding radius outline layer");
      try {
        map.addLayer(
          {
            id: RADIUS_OUTLINE_LAYER_ID,
            type: "line",
            source: RADIUS_SOURCE_ID,
            minzoom: RADIUS_VISIBILITY_MIN_ZOOM,
            paint: {
              "line-color": "#0891b2",
              "line-width": 3.5,
              "line-opacity": 1,
            },
          },
          undefined,
        );
      } catch (e) {
        console.error("Error adding radius outline layer:", e);
      }
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
    if (map.getLayer(ZONE_POI_LABEL_LAYER_ID)) {
      map.removeLayer(ZONE_POI_LABEL_LAYER_ID);
    }
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

export default function HomePage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const userLocationRef = useRef<LngLatTuple | null>(null);
  const selectedZoneRef = useRef<ZoneOption>("all");
  const focusPointRef = useRef<LngLatTuple | null>(null);
  const radiusKmRef = useRef(DEFAULT_RADIUS_KM);
  const suppressSuggestionRef = useRef(false);

  const [selectedZone, setSelectedZone] = useState<ZoneOption>("all");
  const [focusPoint, setFocusPoint] = useState<LngLatTuple | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [searchText, setSearchText] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const zoneLabelMap = useMemo(
    () => ({
      all: "All",
      commercial: "Commercial",
      agriculture: "Agriculture",
      educational: "Educational",
      residential: "Residential",
      industrial: "Industrial",
      health: "Health",
      police: "Police",
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
          setFocusPoint((previous) => previous ?? current);
        },
        () => {
          // Keep map usable without location permission.
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    }

    map.on("style.load", () => {
      if (map.getPitch() < DEFAULT_MAP_PITCH) map.setPitch(DEFAULT_MAP_PITCH);
      if (map.getBearing() !== DEFAULT_MAP_BEARING) map.setBearing(DEFAULT_MAP_BEARING);
      if (map.getZoom() < MIN_3D_ZOOM) map.setZoom(15);

      const center = getActiveRadiusCenter(map);
      addOrUpdateZoneLayers(map, selectedZoneRef.current, center, radiusKmRef.current);
    });

    // Add click handler to set radius center at clicked location
    map.on("click", (e) => {
      if (selectedZoneRef.current !== "all") {
        const clickedLocation: LngLatTuple = [e.lngLat.lng, e.lngLat.lat];
        focusPointRef.current = clickedLocation;
        setFocusPoint(clickedLocation);
        console.log("Radius center set to:", clickedLocation);
      }
    });

    return () => {
      mapRef.current = null;
      markerRef.current?.remove();
      markerRef.current = null;
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
    if (suppressSuggestionRef.current) {
      suppressSuggestionRef.current = false;
      setSuggestions([]);
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
    const query = searchText.trim();
    const map = mapRef.current;

    if (!token || query.length < 2) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);

      try {
        const proximity = map ? `${map.getCenter().lng},${map.getCenter().lat}` : "72.8777,19.076";
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=6&autocomplete=true&types=poi,address,place,locality,neighborhood&proximity=${proximity}&access_token=${token}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data = (await response.json()) as {
          features?: Array<{ id?: string; center?: [number, number]; place_name?: string }>;
        };

        const nextSuggestions = (data.features ?? [])
          .filter((feature): feature is { id: string; center: [number, number]; place_name: string } => {
            return Boolean(feature.id && feature.center && feature.center.length === 2 && feature.place_name);
          })
          .map((feature) => ({
            id: feature.id,
            placeName: feature.place_name,
            center: feature.center,
          }));

        setSuggestions(nextSuggestions);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchText]);

  const applySearchSelection = (selected: GeocodeSuggestion) => {
    const map = mapRef.current;
    if (!map) return;

    suppressSuggestionRef.current = true;
    setSearchText(selected.placeName);
    setSuggestions([]);
    setSearchMessage(`Found: ${selected.placeName}`);
    setFocusPoint(selected.center);

    map.flyTo({ center: selected.center, zoom: 16, speed: 0.9, curve: 1.2 });

    markerRef.current?.remove();
    markerRef.current = new mapboxgl.Marker({ color: "#38bdf8" }).setLngLat(selected.center).addTo(map);
  };

  const handleSearch = async () => {
    const map = mapRef.current;
    const query = searchText.trim();
    if (!map) return;

    if (query.length < 2) {
      setSearchMessage("Type at least 2 characters to search.");
      return;
    }

    if (suggestions.length > 0) {
      applySearchSelection(suggestions[0]);
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
    if (!token) {
      setSearchMessage("Mapbox token is missing.");
      return;
    }

    setIsSearching(true);
    setSearchMessage("");

    try {
      const center = map.getCenter();
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=5&autocomplete=true&types=poi,address,place,locality,neighborhood&proximity=${center.lng},${center.lat}&access_token=${token}`,
      );

      if (!response.ok) {
        setSearchMessage("Search request failed. Please try again.");
        return;
      }

      const data = (await response.json()) as {
        features?: Array<{ id?: string; center?: [number, number]; place_name?: string }>;
      };

      const topResult = data.features
        ?.filter((feature): feature is { id: string; center: [number, number]; place_name: string } => {
          return Boolean(feature.id && feature.center && feature.center.length === 2 && feature.place_name);
        })
        [0];

      if (!topResult) {
        setSearchMessage("No matching place found for this search.");
        return;
      }

      applySearchSelection({
        id: topResult.id,
        placeName: topResult.place_name,
        center: topResult.center,
      });
    } catch {
      setSearchMessage("Search failed. Check internet connection and try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <div ref={mapContainerRef} style={{ width: "100vw", height: "100vh" }} />

      <div
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 10,
          width: 260,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "rgba(15, 23, 42, 0.9)",
          border: "1px solid rgba(148, 163, 184, 0.4)",
          borderRadius: 12,
          padding: 12,
          color: "#e2e8f0",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
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
              💡 Click on the map to center the radius at that location
            </div>
          </>
        ) : null}

        <div style={{ marginTop: 10, fontSize: 12, color: "#93c5fd" }}>Showing: {zoneLabelMap[selectedZone]}</div>
      </div>

      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: 20,
          transform: "translateX(-50%)",
          zIndex: 12,
          width: "min(92vw, 700px)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "stretch",
          padding: "10px 12px",
          borderRadius: 16,
          background: "linear-gradient(135deg, rgba(15,23,42,0.52), rgba(30,41,59,0.36))",
          border: "1px solid rgba(148,163,184,0.45)",
          backdropFilter: "blur(14px) saturate(150%)",
          boxShadow: "0 12px 35px rgba(2,6,23,0.35)",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="text"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              if (searchMessage) setSearchMessage("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSearch();
              }
            }}
            placeholder="Search place, area, restaurant, police station..."
            style={{
              flex: 1,
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.45)",
              background: "rgba(15,23,42,0.5)",
              color: "#f8fafc",
              padding: "10px 12px",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            onClick={() => void handleSearch()}
            disabled={isSearching}
            style={{
              borderRadius: 12,
              border: "1px solid rgba(125,211,252,0.7)",
              background: isSearching ? "rgba(71,85,105,0.45)" : "rgba(14,165,233,0.28)",
              color: "#e0f2fe",
              padding: "10px 14px",
              fontSize: 14,
              fontWeight: 700,
              cursor: isSearching ? "not-allowed" : "pointer",
            }}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>

        {(isLoadingSuggestions || suggestions.length > 0) && searchText.trim().length >= 2 ? (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(15,23,42,0.82)",
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {isLoadingSuggestions ? (
              <div style={{ padding: "10px 12px", color: "#bfdbfe", fontSize: 13 }}>Loading suggestions...</div>
            ) : (
              suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => applySearchSelection(item)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    borderBottom: "1px solid rgba(148,163,184,0.18)",
                    background: "transparent",
                    color: "#e2e8f0",
                    padding: "10px 12px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {item.placeName}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      {searchMessage ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 126,
            transform: "translateX(-50%)",
            zIndex: 12,
            maxWidth: "min(92vw, 700px)",
            borderRadius: 10,
            background: "rgba(15,23,42,0.78)",
            border: "1px solid rgba(148,163,184,0.35)",
            color: "#dbeafe",
            padding: "8px 12px",
            fontSize: 12,
            backdropFilter: "blur(10px)",
          }}
        >
          {searchMessage}
        </div>
      ) : null}
    </>
  );
}
