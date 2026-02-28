import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Calculate time bounds for UI filtering (between 2 and 72 hours ago)
    const upperLimit = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const lowerLimit = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("articles")
      .select(
        "id, title, author, score, attention_level, canonical_url, dev_url, published_at, reactions, comments, explanations",
      )
      .gte("published_at", lowerLimit)
      .lte("published_at", upperLimit)
      .order("score", { ascending: false })
      .limit(100);

    if (error) {
      // PostgrestError is not an Error instance; handle it directly
      console.error("Failed to fetch posts", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Failed to fetch posts", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
