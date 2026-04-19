import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1),
});

const requestSchema = z.object({
  history: z.array(messageSchema).min(1),
  draft: z
    .object({
      title: z.string().optional(),
      type: z.string().optional(),
      description: z.string().optional(),
      location: z
        .object({
          lat: z.number().optional(),
          lng: z.number().optional(),
          address: z.string().optional(),
        })
        .optional(),
      impactRadiusKm: z.number().optional(),
    })
    .optional(),
  userLocation: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

const responseSchema = z.object({
  assistantMessage: z.string(),
  draft: z.object({
    title: z.string().optional(),
    type: z.string().optional(),
    description: z.string().optional(),
    impactRadiusKm: z.number().optional(),
    location: z
      .object({
        lat: z.number().optional(),
        lng: z.number().optional(),
        address: z.string().optional(),
      })
      .optional(),
  }),
  verificationQuestions: z.array(z.string()).default([]),
  readyToSubmit: z.boolean(),
});

function fallbackType(text: string): string {
  const t = text.toLowerCase();
  if (/(pothole|road damage|crack)/.test(t)) return "potholes";
  if (/(garbage|trash|waste|dustbin)/.test(t)) return "garbage";
  if (/(flood|water logging|drain overflow)/.test(t)) return "flooding";
  if (/(streetlight|light)/.test(t)) return "streetlight";
  if (/(traffic|jam|signal)/.test(t)) return "traffic";
  return "other";
}

function extractCoordinatePair(text: string): { lat: number; lng: number } | null {
  const match = text.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const query = address.trim();
  if (!query) return null;

  const token = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (token) {
    try {
      const params = new URLSearchParams({
        access_token: token,
        limit: "1",
        country: "IN",
        language: "en",
      });
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
      const response = await fetch(url);
      if (response.ok) {
        const body = (await response.json()) as { features?: Array<{ center?: [number, number] }> };
        const center = body.features?.[0]?.center;
        if (center && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
          return { lng: center[0], lat: center[1] };
        }
      }
    } catch {
      // Fall back to OSM geocoder below.
    }
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: "1",
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
    if (!response.ok) return null;
    const body = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const first = body[0];
    const lat = Number(first?.lat);
    const lng = Number(first?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

function fallbackAssistant(history: Array<{ role: "user" | "assistant"; text: string }>) {
  const latest = [...history].reverse().find((m) => m.role === "user")?.text || "";
  const coordinateFromText = extractCoordinatePair(latest);
  const type = fallbackType(latest);
  const draft = {
    title: latest.slice(0, 80) || "Citizen issue report",
    type,
    description: latest,
    location: coordinateFromText ? { lat: coordinateFromText.lat, lng: coordinateFromText.lng } : undefined,
  };

  // Generate natural fallback response based on what we know
  let assistantMessage = "";
  const hasLocation = Boolean(coordinateFromText);
  const hasType = type !== "other";
  
  if (!hasType) {
    assistantMessage = "I understand there's an issue. Could you tell me more specifically what type of problem it is? For example, is it a pothole, garbage dumping, flooding, or something else?";
  } else if (!hasLocation) {
    assistantMessage = `Thanks for reporting this ${type} issue. To help you better, could you share where this is happening? Just give me a landmark, address, or the exact area coordinates.`;
  } else {
    assistantMessage = `Got it! I've noted the ${type} at the location you mentioned. Is this affecting just one spot, or a larger area? And how serious would you say it is?`;
  }

  const verificationQuestions: string[] = [];
  if (!hasType) verificationQuestions.push("What type of issue is this?");
  if (!hasLocation) verificationQuestions.push("Where exactly is this problem?");
  if (!draft.description) verificationQuestions.push("Can you describe it in more detail?");

  return {
    assistantMessage,
    draft,
    verificationQuestions,
    readyToSubmit: Boolean(draft.type && draft.description && draft.location?.lat && draft.location?.lng),
  };
}

export async function POST(req: Request) {
  try {
    const body = requestSchema.parse(await req.json());

    const key = process.env.GITHUB_MODEL_TOKEN;
    
    const latestUserText = [...body.history].reverse().find((item) => item.role === "user")?.text ?? "";
    const conversationText = body.history
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");
    const fullText = conversationText + `\nUser: ${latestUserText}`;

    // ===== PRE-EXTRACT DATA FROM CONVERSATION =====
    const preExtracted = { ...body.draft } as any;

    // Extract issue type if not already set
    if (!preExtracted.type) {
      const typePatterns: Array<[RegExp, string]> = [
        [/(pothole|road damage|crack|broken road|damaged road)/, "potholes"],
        [/(garbage|trash|waste|dumping|litter|rubbish)/, "garbage"],
        [/(flood|water logging|drain overflow|stagnant water|waterlogging)/, "flooding"],
        [/(streetlight|street light|light post|lamp|broken light)/, "streetlight"],
        [/(traffic|traffic jam|congestion|signal|lights)/, "traffic"],
        [/(tree|branch|fallen tree)/, "trees"],
        [/(water supply|water|sewer|pipeline)/, "water"],
        [/(dangerous|danger|hazard|risk|safety)/, "danger"],
      ];

      for (const [pattern, type] of typePatterns) {
        if (pattern.test(fullText.toLowerCase())) {
          preExtracted.type = type;
          break;
        }
      }
    }

    // Extract location/coordinates if not already set
    if (!preExtracted.location?.lat || !preExtracted.location?.lng) {
      const coordMatch = fullText.match(/(\d{1,2}\.\d+)\s*,\s*(\d{1,3}\.\d+)/);
      if (coordMatch) {
        preExtracted.location = {
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2]),
          address: preExtracted.location?.address,
        };
      }
    }

    // Extract landmark/address if not already set
    if (!preExtracted.location?.address) {
      const addressPatterns = [
        /(?:at|near|in|location|address|landmark|area|place)[\s:]+([a-zA-Z\s,0-9-]+?)(?:\.|,|$)/i,
        /(?:near|close to|at the)\s+([a-zA-Z\s]+?)(?:\s+area|\s+road|\s+street|\s+institute|\s+hospital|\.|\s|$)/i,
      ];

      for (const pattern of addressPatterns) {
        const match = fullText.match(pattern);
        if (match) {
          preExtracted.location = {
            ...preExtracted.location,
            address: match[1].trim().substring(0, 150),
          };
          break;
        }
      }
    }

    // Geocode address if we have it but no coordinates
    if (preExtracted.location?.address && !preExtracted.location?.lat) {
      const geocoded = await geocodeAddress(preExtracted.location.address);
      if (geocoded) {
        preExtracted.location = {
          ...preExtracted.location,
          lat: geocoded.lat,
          lng: geocoded.lng,
        };
      }
    }

    // Extract radius/area impact if not already set
    if (!preExtracted.impactRadiusKm) {
      const radiusMatch = fullText.match(/(\d+)\s*(?:meter|meters|m|km|kilometer|kilometres?|radius|area)/i);
      if (radiusMatch) {
        const value = parseInt(radiusMatch[1]);
        if (radiusMatch[0].toLowerCase().match(/meter|m\b/)) {
          preExtracted.impactRadiusKm = value / 1000;
        } else {
          preExtracted.impactRadiusKm = value;
        }
      }
    }

    // Set description
    preExtracted.description = latestUserText;

    // Determine what's still missing
    const hasType = Boolean(preExtracted.type && preExtracted.type !== "other");
    const hasLocation = Boolean(preExtracted.location?.lat && preExtracted.location?.lng) || Boolean(preExtracted.location?.address);
    const needsType = !hasType;
    const needsLocation = !hasLocation;

    // ===== CALL GROQ WITH CONTEXT ABOUT WHAT'S ALREADY EXTRACTED =====
    if (!key) {
      return NextResponse.json(generateSmartResponse(preExtracted, needsType, needsLocation, body.history));
    }

    const systemPrompt = `You are Nivaari, an intelligent and friendly civic report assistant for Bangalore.

Your role: Help citizens report infrastructure and civic issues (potholes, garbage, flooding, streetlights, traffic, etc.)

CURRENT EXTRACTED DATA:
- Type: ${preExtracted.type || "(not yet specified)"}
- Location: ${preExtracted.location?.address || preExtracted.location?.lat ? `${preExtracted.location?.address || ""}(${preExtracted.location?.lat}, ${preExtracted.location?.lng})` : "(not yet specified)"}
- Description: ${preExtracted.description || ""}
- Area Impact: ${preExtracted.impactRadiusKm ? `${preExtracted.impactRadiusKm} km` : "point issue"}

IMPORTANT:
- DO NOT ask about information already provided
- If type is set, don't ask "what type of issue is this?"
- If location is set, don't ask "where is this happening?"
- Ask ONLY about missing critical information (max 1 question)
- Be natural, friendly, and responsive like ChatGPT
- Acknowledge what the user has already told you

Continue the conversation naturally.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...body.history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.text,
      })),
    ];

    try {
      const resp = await fetch("https://models.inference.ai.azure.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.7,
          max_tokens: 250,
          messages,
        }),
      });

      if (!resp.ok) {
        console.warn(`GitHub Model API error: ${resp.status}`);
        return NextResponse.json(generateSmartResponse(preExtracted, needsType, needsLocation, body.history));
      }

      const raw = (await resp.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: { message: string };
      };

      if (raw.error) {
        console.warn(`GitHub Model error: ${raw.error.message}`);
        return NextResponse.json(generateSmartResponse(preExtracted, needsType, needsLocation, body.history));
      }

      const assistantMessage = raw.choices?.[0]?.message?.content || "";
      if (!assistantMessage) {
        return NextResponse.json(generateSmartResponse(preExtracted, needsType, needsLocation, body.history));
      }

      // Check readiness
      const readyToSubmit = Boolean(preExtracted.type && preExtracted.location?.lat && preExtracted.location?.lng && preExtracted.description);

      // Build smart verification questions
      const verificationQuestions: string[] = [];
      if (needsType) verificationQuestions.push("What type of civic issue is this?");
      if (needsLocation) verificationQuestions.push("Could you share the exact location or landmark?");

      return NextResponse.json({
        assistantMessage,
        draft: preExtracted,
        verificationQuestions,
        readyToSubmit,
      });
    } catch (githubError) {
      console.error("GitHub Model API fetch error:", githubError);
      return NextResponse.json(generateSmartResponse(preExtracted, needsType, needsLocation, body.history));
    }
  } catch (error) {
    console.error("Citizen report chat error", error);
    return NextResponse.json(
      { error: "Failed to process report chat" },
      { status: 500 }
    );
  }
}

// Helper function to generate smart responses
function generateSmartResponse(
  draft: any,
  needsType: boolean,
  needsLocation: boolean,
  history: Array<{ role: "user" | "assistant"; text: string }>
) {
  let assistantMessage = "";

  if (needsType && needsLocation) {
    assistantMessage = "I understand there's an issue. Could you tell me what type of problem it is and where it's happening? For example: 'pothole near the market' or 'garbage at SFIT area'.";
  } else if (needsType) {
    assistantMessage = `Thanks for mentioning the location. Could you specify what type of issue this is? (pothole, garbage, flooding, streetlight, traffic, etc.)`;
  } else if (needsLocation) {
    assistantMessage = `I noted this is a ${draft.type || "civic"} issue. Could you tell me the exact location or landmark where this is happening?`;
  } else {
    assistantMessage = `Perfect! I have the details: ${draft.type || "issue"} at ${draft.location?.address || "the location"}. Is this affecting a large area or just a point? Any other details you'd like to add?`;
  }

  const readyToSubmit = Boolean(draft.type && draft.location?.lat && draft.location?.lng && draft.description);

  const verificationQuestions: string[] = [];
  if (needsType) verificationQuestions.push("What type of issue is this?");
  if (needsLocation) verificationQuestions.push("Where exactly is this?");

  return {
    assistantMessage,
    draft,
    verificationQuestions,
    readyToSubmit,
  };
}
