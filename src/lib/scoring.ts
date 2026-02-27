import { ForemArticle, ForemUser, ForemComment } from "./forem";

export interface ScoreBreakdown {
  total: number;
  behavior: number;
  audience: number;
  pattern: number;
  explanations: string[];
  attention_level: "low" | "medium" | "high";
}

export function evaluatePriority(
  article: ForemArticle,
  user: ForemUser | null,
  comments: ForemComment[],
  recentPostsByAuthor: ForemArticle[],
): ScoreBreakdown {
  let behavior = 0;
  let audience = 0;
  let pattern = 0;
  const explanations: string[] = [];

  // BEHAVIOR SCORE (Max 34)
  if (user) {
    const joinedAt = new Date(user.joined_at);
    const ageDays = (Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < 7) {
      behavior += 15;
      explanations.push("Account age is less than 7 days");
    }
  }

  // Link density / canonical usage
  if (article.canonical_url && !article.canonical_url.includes("dev.to")) {
    behavior += 10;
    explanations.push("Uses off-site canonical URL");
  }

  // High post frequency
  const publishedAt = new Date(article.published_at);
  const recentPosts = recentPostsByAuthor.filter((p) => {
    const pDate = new Date(p.published_at);
    const hoursDiff =
      Math.abs(publishedAt.getTime() - pDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  });

  if (recentPosts.length > 2) {
    behavior += 9;
    explanations.push("High post frequency (more than 2 posts in 24 hours)");
  }

  // AUDIENCE SCORE (Max 33)
  const uniqueCommenters = new Set(comments.map((c) => c.user.username));
  if (comments.length > 0) {
    if (uniqueCommenters.size <= 2 && comments.length > 3) {
      audience += 15;
      explanations.push("Low unique participants vs comment count");
    }
    // (Simplified) repeated commenters logic could span across other posts.
    // Here we check if the current commenters heavily comment on Author's previous posts.
    // Since we don't fetch all comments for all posts locally every time, we approximate:
    audience += 5; // Baseline for engaging
  } else {
    // If no comments but high reactions, maybe artificial?
    if (article.public_reactions_count > 20) {
      audience += 15;
      explanations.push("High reactions with zero comments");
    }
  }

  // PATTERN SCORE (Max 33)
  const currentTags = article.tag_list.sort().join(",");
  const repeatedTags = recentPostsByAuthor.filter(
    (p) => p.id !== article.id && p.tag_list.sort().join(",") === currentTags,
  );

  if (repeatedTags.length > 0) {
    pattern += 15;
    explanations.push("Repeated tag combinations used recently");
  }

  if (recentPostsByAuthor.length > 1) {
    // Check publish timing gaps
    const gaps: number[] = [];
    for (let i = 0; i < recentPostsByAuthor.length - 1; i++) {
      const date1 = new Date(recentPostsByAuthor[i].published_at).getTime();
      const date2 = new Date(recentPostsByAuthor[i + 1].published_at).getTime();
      gaps.push(Math.abs(date1 - date2));
    }
    const uniformGaps = gaps.every(
      (g) => Math.abs(g - gaps[0]) < 1000 * 60 * 5,
    ); // within 5 min variance
    if (gaps.length > 0 && uniformGaps) {
      pattern += 18;
      explanations.push("Regular/automated publish timing");
    }
  }

  const total = Math.min(100, behavior + audience + pattern);

  let attention_level: "low" | "medium" | "high" = "low";
  if (total >= 70) attention_level = "high";
  else if (total >= 40) attention_level = "medium";

  return {
    total,
    behavior,
    audience,
    pattern,
    explanations,
    attention_level,
  };
}
