import { NextResponse } from "next/server";

/**
 * API proxy route for Google Input Tools Handwriting Recognition.
 * Proxies requests to avoid CORS issues when calling from the client.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(
      "https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=demopage",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Recognition service unavailable" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Handwriting recognition error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
