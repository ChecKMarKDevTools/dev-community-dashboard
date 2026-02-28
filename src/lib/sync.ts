import { ForemUser, ForemComment, ForemClient } from "@/lib/forem";
import { supabase } from "@/lib/supabase";

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

/** Resolves User from API, caching them logically (but ForemClient handles underlying caching too) */
async function resolveUser(
  username: string,
  userCache: Map<string, ForemUser | null>,
): Promise<ForemUser | null> {
  if (userCache.has(username))
    return userCache.get(username) as ForemUser | null;
  const user = await ForemClient.getUserByUsername(username);
  userCache.set(username, user);
  return user;
}

// Math Helpers for Pipeline
function getAgeHours(published_at: string): number {
  return (Date.now() - new Date(published_at).getTime()) / (1000 * 60 * 60);
}

function countWords(textHtml?: string): number {
  if (!textHtml) return 0;
  // A rough estimate for parsed comments body
  return textHtml
    .replace(/<[^>]*>?/gm, "")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

// Basic Sentiments (for Hackathon requirement)
const POSITIVE_WORDS = [
  "awesome",
  "great",
  "excellent",
  "love",
  "good",
  "amazing",
  "thanks",
  "helpful",
];
const NEGATIVE_WORDS = [
  "terrible",
  "bad",
  "awful",
  "hate",
  "unhelpful",
  "wrong",
  "broken",
  "issue",
  "bug",
];

export async function syncArticles(maxToProcess?: number): Promise<SyncResult> {
  const errors: string[] = [];
  const userCache = new Map<string, ForemUser | null>();
  const upsertedAuthors = new Set<string>();

  try {
    // --- STEP 1: FETCH ARTICLES ---
    // Fetch 2 pages of 100
    const page1 = await ForemClient.getLatestArticles(1, 100);
    const page2 = await ForemClient.getLatestArticles(2, 100);
    const allArticles = [...page1, ...page2];

    // Discard < 2h or > 72h
    const validArticles = allArticles.filter((a) => {
      const ageHours = getAgeHours(a.published_at);
      return ageHours >= 2 && ageHours <= 72;
    });

    // We need recent post frequencies per author. We map this here from the full raw batch
    const postsByAuthor24h = new Map<string, number>();
    for (const a of allArticles) {
      const age = getAgeHours(a.published_at);
      if (age <= 24) {
        postsByAuthor24h.set(
          a.user.username,
          (postsByAuthor24h.get(a.user.username) || 0) + 1,
        );
      }
    }

    // --- STEP 2: LIGHT SCORING ---
    const scoredCandidates = validArticles.map((article) => {
      const word_count = article.reading_time_minutes * 200; // estimated
      const author_post_frequency =
        postsByAuthor24h.get(article.user.username) || 1;
      const age_hours = getAgeHours(article.published_at);
      const preliminary_score =
        article.public_reactions_count +
        article.comments_count * 2 +
        word_count / 100 -
        age_hours -
        author_post_frequency;

      return {
        article,
        preliminary_score,
        word_count,
        age_hours,
        author_post_frequency,
      };
    });

    // Shortlist top candidates (default 20 unless specified)
    scoredCandidates.sort((a, b) => b.preliminary_score - a.preliminary_score);
    const shortlist = scoredCandidates.slice(0, maxToProcess || 20);

    // --- STEP 3 & 4: DEEP FETCH & CLASSIFICATION ---
    let synced = 0;
    let failed = 0;

    for (const candidate of shortlist) {
      try {
        const {
          article,
          preliminary_score,
          word_count,
          age_hours,
          author_post_frequency,
        } = candidate;
        const username = article.user.username;

        // Upsert User
        const detailedUser = await resolveUser(username, userCache);
        if (detailedUser && !upsertedAuthors.has(username)) {
          const { error: userError } = await supabase.from("users").upsert({
            username: detailedUser.username,
            joined_at: detailedUser.joined_at,
            updated_at: new Date().toISOString(),
          });
          if (userError) throw new Error(userError.message);
          upsertedAuthors.add(username);
        }

        // Deep Fetch Comments
        const comments = await ForemClient.getComments(article.id);

        // Compute Discussion Metrics
        const comment_count = article.comments_count;
        const reaction_count = article.public_reactions_count;
        const time_since_post = age_hours * 60; // in minutes

        const uniqueCommenters = new Set<string>();
        let totalCommentWords = 0;
        let pos_comments = 0;
        let neg_comments = 0;
        let alternating_pairs = 0; // ABAB patterns
        let replies_with_parent = 0;
        let promo_keywords = 0;
        let help_keywords = 0;

        const PROMO_WORDS = [
          "subscribe",
          "follow",
          "check out",
          "buy",
          "sale",
          "link in bio",
        ];
        const HELP_WORDS = [
          "stuck",
          "confused",
          "need help",
          "why doesn't",
          "how do i",
          "what am i missing",
          "beginner question",
        ];

        // Flatten comments to analyze
        function processCommentTree(
          thread: ForemComment[],
          parentAuthor?: string,
        ) {
          for (const c of thread) {
            const commenter = c.user.username;
            uniqueCommenters.add(commenter);

            const txt = c.body_html.toLowerCase();
            totalCommentWords += countWords(c.body_html);

            if (parentAuthor) {
              replies_with_parent++;
              if (c.children && c.children.length > 0) {
                const replyAuthor = c.children[0].user.username;
                if (replyAuthor === parentAuthor) alternating_pairs++;
              }
            }

            // Sentiment heuristic
            const words = txt.split(/\W+/);
            if (words.some((w) => POSITIVE_WORDS.includes(w))) pos_comments++;
            if (words.some((w) => NEGATIVE_WORDS.includes(w))) neg_comments++;

            // Detect keywords
            PROMO_WORDS.forEach((pw) => {
              if (txt.includes(pw)) promo_keywords++;
            });
            HELP_WORDS.forEach((hw) => {
              if (txt.includes(hw)) help_keywords++;
            });

            if (c.children && c.children.length > 0) {
              processCommentTree(c.children, commenter);
            }
          }
        }
        processCommentTree(comments);

        // Core calculated metrics
        const distinct_commenters = uniqueCommenters.size;
        const comments_per_hour =
          comment_count / Math.max(1, time_since_post / 60);
        const avg_comment_length =
          comment_count > 0 ? totalCommentWords / comment_count : 0;
        const reply_ratio = replies_with_parent / Math.max(1, comment_count);
        const effort =
          Math.log2(word_count + 1) +
          distinct_commenters +
          avg_comment_length / 40;
        const exposure = Math.max(1, reaction_count + comment_count);

        // Sub scores
        const attention_delta = effort - Math.log2(exposure + 1);
        const sentiment_flips =
          Math.abs(pos_comments - neg_comments) / Math.max(1, comment_count);
        const heat_score =
          comments_per_hour +
          reply_ratio * 3 +
          alternating_pairs +
          sentiment_flips;

        // Note on promo link logic: skipping exact same_external_domain count without HTML parser, using promo_keywords instead for low quality
        const risk_score =
          author_post_frequency * 2 +
          (word_count < 120 ? 2 : 0) +
          (reaction_count === 0 && comment_count === 0 ? 2 : 0) +
          promo_keywords;

        const is_first_post = detailedUser
          ? (Date.now() - new Date(detailedUser.joined_at).getTime()) /
              (1000 * 60 * 60 * 24) <
              30 && postsByAuthor24h.get(username) === 1
          : false;
        const support_score =
          (is_first_post ? 2 : 0) +
          (reaction_count === 0 ? 1 : 0) +
          (comment_count === 0 ? 2 : 0) +
          help_keywords;

        // Apply IF logic
        let category = "NORMAL";

        if (time_since_post >= 30 && support_score >= 3) {
          category = "NEEDS_RESPONSE";
        } else if (risk_score >= 4) {
          category = "POSSIBLY_LOW_QUALITY";
        } else if (
          comment_count >= 6 &&
          heat_score >= 5 &&
          comment_count > 0 &&
          reaction_count / comment_count < 1.2
        ) {
          category = "NEEDS_REVIEW";
        } else if (
          word_count >= 600 &&
          distinct_commenters >= 2 &&
          avg_comment_length >= 18 &&
          reaction_count <= 5 &&
          attention_delta >= 3
        ) {
          category = "BOOST_VISIBILITY";
        }

        // Fallback to "NORMAL"
        const final_score = Math.max(0, preliminary_score);

        // Save to DB
        const explanations = [
          `Word Count: ${word_count}`,
          `Unique Commenters: ${distinct_commenters}`,
          `Heat Score: ${heat_score.toFixed(2)}`,
          `Risk Score: ${risk_score}`,
          `Support Score: ${support_score}`,
        ];

        const { error: articleError } = await supabase.from("articles").upsert({
          id: article.id,
          author: username,
          published_at: article.published_at,
          reactions: reaction_count,
          comments: comment_count,
          tags: article.tag_list,
          canonical_url: article.canonical_url,
          dev_url: article.url, // NEW FIELD
          score: Math.round(final_score),
          attention_level: category, // NEW CATEGORIES
          explanations: explanations,
          title: article.title,
          updated_at: new Date().toISOString(),
        });

        if (articleError) throw new Error(articleError.message);

        // Save commenters for simple integrity tracking mapping
        for (const commenter of Array.from(uniqueCommenters)) {
          await supabase
            .from("commenters")
            .upsert(
              { article_id: article.id, username: commenter },
              { onConflict: "article_id,username" },
            );
        }

        synced++;
      } catch (err: unknown) {
        failed++;
        console.log("SYNC ERROR DETECTED:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Article ${candidate.article.id}: ${message}`);
      }
    }

    return { synced, failed, errors };
  } catch (err: unknown) {
    throw err instanceof Error ? err : new Error("Fatal Sync Pipeline Error");
  }
}
