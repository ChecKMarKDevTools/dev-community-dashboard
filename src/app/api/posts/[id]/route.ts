import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Fetch the article
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Fetch recent posts by same author
    const { data: recentPosts, error: recentError } = await supabase
      .from("articles")
      .select("id, title, published_at, score, attention_level")
      .eq("author", article.author)
      .neq("id", id)
      .order("published_at", { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    return NextResponse.json({
      article,
      recentPosts,
    });
  } catch (error: unknown) {
    console.error(`Failed to fetch post ${params.id}`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
