import { NextResponse } from "next/server";
import { ForemClient } from "@/lib/forem";
import { evaluatePriority } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch latest articles (e.g. limit to 100 for sync)
    const articles = await ForemClient.getLatestArticles(1, 100);

    for (const article of articles) {
      // Upsert User
      const author = article.user;
      // Try to get detailed user to compute age
      const detailedUser = await ForemClient.getUserByUsername(author.username);

      if (detailedUser) {
        await supabase.from("users").upsert({
          username: detailedUser.username,
          joined_at: detailedUser.joined_at,
          updated_at: new Date().toISOString(),
        });
      }

      // Filter recent posts for behavior and pattern scores
      const recentPosts = articles.filter(
        (a) => a.user.username === author.username,
      );

      // Fetch comments for audience score
      const comments = await ForemClient.getComments(article.id);

      // Calculate priority
      const score = evaluatePriority(
        article,
        detailedUser,
        comments,
        recentPosts,
      );

      // Upsert Article
      await supabase.from("articles").upsert({
        id: article.id,
        author: author.username,
        published_at: article.published_at,
        reactions: article.public_reactions_count,
        comments: article.comments_count,
        tags: article.tag_list,
        canonical_url: article.canonical_url,
        // The spec needs us to store the score for reading
        score: score.total, // Ensure we have a score column if not in original schema, wait, actually we compute it on the fly or store it.
        attention_level: score.attention_level,
        explanations: score.explanations,
        title: article.title, // Add title for UI
        updated_at: new Date().toISOString(),
      });

      // Upsert Commenters
      for (const comment of comments) {
        await supabase.from("commenters").upsert(
          {
            article_id: article.id,
            username: comment.user.username,
          },
          { onConflict: "article_id,username" },
        );
      }
    }

    return NextResponse.json({ success: true, count: articles.length });
  } catch (error: unknown) {
    console.error("Cron sync failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
