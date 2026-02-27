// Forem Community API Client

const BASE_URL = "https://dev.to/api";

export interface ForemArticle {
  id: number;
  title: string;
  description: string;
  readable_publish_date: string;
  slug: string;
  path: string;
  url: string;
  comments_count: number;
  public_reactions_count: number;
  collection_id: number | null;
  published_timestamp: string;
  positive_reactions_count: number;
  cover_image: string | null;
  social_image: string;
  canonical_url: string;
  created_at: string;
  edited_at: string | null;
  crossposted_at: string | null;
  published_at: string;
  last_comment_at: string;
  reading_time_minutes: number;
  tag_list: string[];
  tags: string;
  user: {
    name: string;
    username: string;
    twitter_username: string | null;
    github_username: string | null;
    user_id: number;
    website_url: string | null;
    profile_image: string;
    profile_image_90: string;
  };
}

export interface ForemUser {
  type_of: string;
  id: number;
  username: string;
  name: string;
  summary: string;
  twitter_username: string | null;
  github_username: string | null;
  website_url: string | null;
  location: string | null;
  joined_at: string;
  profile_image: string;
}

export interface ForemComment {
  type_of: string;
  id_code: string;
  created_at: string;
  body_html: string;
  user: {
    name: string;
    username: string;
    twitter_username: string | null;
    github_username: string | null;
    website_url: string | null;
    profile_image: string;
    profile_image_90: string;
  };
  children: ForemComment[];
}

export class ForemClient {
  static async getLatestArticles(
    page: number = 1,
    perPage: number = 100,
  ): Promise<ForemArticle[]> {
    const res = await fetch(
      `${BASE_URL}/articles?per_page=${perPage}&page=${page}`,
      {
        next: { revalidate: 300 }, // Used sparingly in next apps, but standard fetch options apply
      },
    );
    if (!res.ok) throw new Error("Failed to fetch articles");
    return res.json();
  }

  static async getArticle(id: number): Promise<ForemArticle> {
    const res = await fetch(`${BASE_URL}/articles/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch article ${id}`);
    return res.json();
  }

  static async getUserByUsername(username: string): Promise<ForemUser | null> {
    const res = await fetch(`${BASE_URL}/users/by_username?url=${username}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch user ${username}`);
    return res.json();
  }

  static async getComments(articleId: number): Promise<ForemComment[]> {
    const res = await fetch(`${BASE_URL}/comments?a_id=${articleId}`);
    if (!res.ok)
      throw new Error(`Failed to fetch comments for article ${articleId}`);
    return res.json();
  }
}
