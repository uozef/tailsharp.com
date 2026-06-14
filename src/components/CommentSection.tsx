"use client";

import { useState } from "react";
import { ThumbsUp, MessageSquare } from "lucide-react";
import type { FollowerComment } from "@/lib/mock-data";

interface Props {
  comments: FollowerComment[];
}

const sentimentDot: Record<string, string> = {
  positive: "bg-green-500",
  neutral: "bg-gray-400",
  negative: "bg-red-400",
};

export default function CommentSection({ comments }: Props) {
  const [showAll, setShowAll] = useState(false);

  const sorted = [...comments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const visible = showAll ? sorted : sorted.slice(0, 5);

  return (
    <div className="rounded-xl border border-card-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        Follower Comments
      </p>

      {/* Mock add comment */}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-8 w-8 shrink-0 rounded-full bg-green-200" />
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Add a comment..."
            className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-blue-400"
            readOnly
          />
          <MessageSquare className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </div>

      {/* Comment list */}
      <div className="mt-4 space-y-4">
        {visible.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            {/* Avatar */}
            <img
              src={comment.avatarUrl}
              alt={comment.username}
              className="h-8 w-8 shrink-0 rounded-full bg-surface-inset object-cover"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {comment.username}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${sentimentDot[comment.sentiment]}`}
                  title={comment.sentiment}
                />
                <span className="text-xs text-muted">{comment.date}</span>
              </div>
              <p className="mt-0.5 text-sm text-foreground/80">
                {comment.text}
              </p>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted">
                <ThumbsUp className="h-3 w-3" />
                {comment.likes}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show more */}
      {!showAll && sorted.length > 5 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full rounded-lg border border-card-border py-1.5 text-center text-sm font-medium text-muted transition-colors hover:bg-card-bg hover:text-foreground"
        >
          Show more ({sorted.length - 5} remaining)
        </button>
      )}
    </div>
  );
}
