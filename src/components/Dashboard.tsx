"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  AlertCircle,
  ChevronRight,
  Clock,
  User,
  MessageSquare,
  Heart,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Post = {
  id: string;
  title: string;
  url: string;
  score: number;
  attention_level: "low" | "medium" | "high";
  explanations: string[];
  created_at: string;
  author_name: string;
  author_username: string;
  comments_count: number;
  public_reactions_count: number;
  page_views_count: number;
};

export function Dashboard() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedPostId, setSelectedPostId] = React.useState<string | null>(
    null,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [postDetails, setPostDetails] = React.useState<any>(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    if (selectedPostId) {
      setDetailsLoading(true);
      fetch(`/api/posts/${selectedPostId}`)
        .then((res) => res.json())
        .then((data) => {
          setPostDetails(data);
          setDetailsLoading(false);
        })
        .catch(() => setDetailsLoading(false));
    } else {
      setPostDetails(null);
    }
  }, [selectedPostId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-50">
      {/* Left panel: Post List */}
      <div
        className={cn(
          "flex flex-col w-full border-r border-brand-200 bg-white transition-all duration-300",
          selectedPostId ? "md:w-1/2 lg:w-4/12 hidden md:flex" : "w-full",
        )}
      >
        <div className="p-6 border-b border-brand-100 bg-white">
          <h1 className="text-2xl font-bold text-brand-900 tracking-tight">
            Community Queue
          </h1>
          <p className="text-sm text-brand-500 mt-1">
            Posts requiring moderation attention.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {posts.map((post) => (
            <Card
              key={post.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md border-brand-100 hover:border-brand-300",
                selectedPostId === post.id
                  ? "ring-2 ring-brand-500 bg-brand-50"
                  : "bg-white",
              )}
              onClick={() => setSelectedPostId(post.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-brand-900 truncate">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-brand-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {post.author_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{" "}
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge
                      variant={
                        post.attention_level === "high"
                          ? "destructive"
                          : post.attention_level === "medium"
                            ? "warning"
                            : "success"
                      }
                    >
                      {post.attention_level.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-medium text-brand-600">
                      Score: {post.score}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-12 text-brand-400">
              <AlertCircle className="mx-auto h-8 w-8 mb-3 opacity-50" />
              <p>No posts found. Waiting for data sync.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Post Details */}
      {(selectedPostId || (!selectedPostId && window.innerWidth >= 768)) && (
        <div
          className={cn(
            "flex-1 p-6 md:p-8 bg-brand-50/50 overflow-y-auto relative",
            !selectedPostId && "hidden md:flex items-center justify-center",
          )}
        >
          {!selectedPostId ? (
            <div className="text-center text-brand-400 max-w-sm">
              <div className="mx-auto w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-brand-300" />
              </div>
              <p className="text-lg font-medium text-brand-700">
                Select a post to view details
              </p>
              <p className="text-sm mt-2">
                The detailed moderation breakdown will appear here.
              </p>
            </div>
          ) : detailsLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : postDetails ? (
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
              <div className="md:hidden mb-4">
                <button
                  onClick={() => setSelectedPostId(null)}
                  className="text-sm text-brand-600 hover:text-brand-800 flex items-center gap-1 font-medium"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" /> Back to queue
                </button>
              </div>

              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-100">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-brand-900 leading-tight">
                      <a
                        href={postDetails.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline hover:text-brand-600 transition-colors"
                      >
                        {postDetails.title}
                      </a>
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-brand-600">
                      <span className="flex items-center gap-1.5 bg-brand-50 px-3 py-1.5 rounded-full font-medium">
                        <User className="h-4 w-4" /> @
                        {postDetails.author_username}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />{" "}
                        {new Date(postDetails.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      postDetails.attention_level === "high"
                        ? "destructive"
                        : postDetails.attention_level === "medium"
                          ? "warning"
                          : "success"
                    }
                    className="text-sm px-3 py-1"
                  >
                    {postDetails.attention_level.toUpperCase()} PRIORITY
                  </Badge>
                </div>

                <div className="flex items-center gap-6 py-4 border-y border-brand-100 mb-8">
                  <div className="flex items-center gap-2 text-brand-700">
                    <Heart className="h-5 w-5 text-danger-500" />{" "}
                    <span className="font-semibold">
                      {postDetails.public_reactions_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-brand-700">
                    <MessageSquare className="h-5 w-5 text-brand-500" />{" "}
                    <span className="font-semibold">
                      {postDetails.comments_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-brand-700">
                    <Eye className="h-5 w-5 text-brand-400" />{" "}
                    <span className="font-semibold">
                      {postDetails.page_views_count}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Score Breakdown */}
                  <Card className="border-brand-100 bg-brand-50/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-brand-800">
                        Score Breakdown
                      </CardTitle>
                      <CardDescription>
                        Total calculated score: {postDetails.score}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(postDetails.score_breakdown || {}).map(
                        ([category, value]) => (
                          <div key={category} className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-sm font-medium text-brand-700">
                              <span className="capitalize">
                                {category} Score
                              </span>
                              <span>{value as number} pts</span>
                            </div>
                            <div className="h-2 w-full bg-brand-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  (value as number) > 20
                                    ? "bg-danger-500"
                                    : (value as number) > 10
                                      ? "bg-warning-500"
                                      : "bg-brand-500",
                                )}
                                style={{
                                  width: `${Math.min(((value as number) / 50) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </CardContent>
                  </Card>

                  {/* Context & Flags */}
                  <Card className="border-brand-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-brand-800">
                        Investigation Context
                      </CardTitle>
                      <CardDescription>
                        Flags triggered by the system
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {postDetails.explanations &&
                      postDetails.explanations.length > 0 ? (
                        <ul className="space-y-3">
                          {postDetails.explanations.map(
                            (exp: string, i: number) => (
                              <li
                                key={i}
                                className="flex gap-3 text-sm text-brand-700 bg-brand-50 p-3 rounded-lg border border-brand-100"
                              >
                                <AlertCircle className="h-4 w-4 shrink-0 text-brand-500 mt-0.5" />
                                <span className="leading-snug">{exp}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-brand-500 italic">
                          No specific flags raised. Routine interaction patterns
                          detected.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Author History */}
              {postDetails.recent_posts &&
                postDetails.recent_posts.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-brand-900 mb-4 px-1">
                      Recent Posts by Author
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {postDetails.recent_posts.map((rp: any) => (
                        <Card
                          key={rp.id}
                          className="border-brand-100 hover:border-brand-300 transition-colors"
                        >
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base line-clamp-2 text-brand-800">
                              <a
                                href={rp.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {rp.title}
                              </a>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-brand-500">
                                {new Date(rp.created_at).toLocaleDateString()}
                              </span>
                              <Badge
                                variant={
                                  rp.attention_level === "high"
                                    ? "destructive"
                                    : rp.attention_level === "medium"
                                      ? "warning"
                                      : "outline"
                                }
                                className="text-[10px] px-2 py-0"
                              >
                                SCORE: {Math.round(rp.score)}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
