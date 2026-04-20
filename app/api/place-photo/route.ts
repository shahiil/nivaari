import { NextRequest, NextResponse } from "next/server";

type PhotoPayload = {
  imageUrl?: string;
  source?: "google" | "foursquare" | "mapbox-fallback";
};

const getGooglePlacePhoto = async (name: string, lat: string, lng: string): Promise<PhotoPayload> => {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return {};

  try {
    const input = encodeURIComponent(`${name} ${lat},${lng}`);
    const findPlaceUrl =
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
      `?input=${input}&inputtype=textquery&fields=photos,name,geometry&key=${key}`;

    const response = await fetch(findPlaceUrl, { next: { revalidate: 0 } });
    if (!response.ok) return {};

    const body = (await response.json()) as {
      candidates?: Array<{ photos?: Array<{ photo_reference?: string }> }>;
    };

    const photoRef = body.candidates?.[0]?.photos?.[0]?.photo_reference;
    if (!photoRef) return {};

    const imageUrl =
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?maxwidth=600&photo_reference=${encodeURIComponent(photoRef)}&key=${key}`;

    return { imageUrl, source: "google" };
  } catch {
    return {};
  }
};

const getFoursquarePhoto = async (name: string, lat: string, lng: string): Promise<PhotoPayload> => {
  const key = process.env.FOURSQUARE_API_KEY;
  if (!key) return {};

  try {
    const searchUrl =
      `https://api.foursquare.com/v3/places/search` +
      `?query=${encodeURIComponent(name)}&ll=${encodeURIComponent(`${lat},${lng}`)}&limit=1`;

    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: key },
      next: { revalidate: 0 },
    });
    if (!searchResponse.ok) return {};

    const searchBody = (await searchResponse.json()) as { results?: Array<{ fsq_id?: string }> };
    const fsqId = searchBody.results?.[0]?.fsq_id;
    if (!fsqId) return {};

    const photosUrl = `https://api.foursquare.com/v3/places/${fsqId}/photos?limit=1`;
    const photoResponse = await fetch(photosUrl, {
      headers: { Authorization: key },
      next: { revalidate: 0 },
    });
    if (!photoResponse.ok) return {};

    const photos = (await photoResponse.json()) as Array<{ prefix?: string; suffix?: string }>;
    const image = photos?.[0];
    if (!image?.prefix || !image?.suffix) return {};

    const imageUrl = `${image.prefix}original${image.suffix}`;
    return { imageUrl, source: "foursquare" };
  } catch {
    return {};
  }
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const name = params.get("name")?.trim();
  const lat = params.get("lat")?.trim();
  const lng = params.get("lng")?.trim();

  if (!name || !lat || !lng) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  const google = await getGooglePlacePhoto(name, lat, lng);
  if (google.imageUrl) return NextResponse.json(google);

  const foursquare = await getFoursquarePhoto(name, lat, lng);
  if (foursquare.imageUrl) return NextResponse.json(foursquare);

  return NextResponse.json({} satisfies PhotoPayload);
}
