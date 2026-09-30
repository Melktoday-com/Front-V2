"use client";

import { useEffect, useRef } from "react";
import { postService } from "@/services/post.service";

// Session-level set of already observed post IDs to prevent spamming
const sessionViewedPostIds = new Set<string>();

/**
 * Hook to automatically observe a post element using IntersectionObserver.
 * When visible for >= 800ms with >= 50% ratio, it triggers an async view recording.
 */
export function usePostViewObserver(postId?: string, enabled = true) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || !postId || sessionViewedPostIds.has(postId)) {
      return;
    }

    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    let viewTimer: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.4) {
          // Start timer for 800ms dwell time
          if (!viewTimer && !sessionViewedPostIds.has(postId)) {
            viewTimer = setTimeout(() => {
              if (!sessionViewedPostIds.has(postId)) {
                sessionViewedPostIds.add(postId);
                // Call backend view trigger silently in background
                postService.getPostByIdOrSlug(postId).catch(() => {
                  // Ignore background network errors
                });
              }
            }, 800);
          }
        } else {
          // Left viewport before 800ms
          if (viewTimer) {
            clearTimeout(viewTimer);
            viewTimer = null;
          }
        }
      },
      {
        threshold: [0.4],
        rootMargin: "0px",
      }
    );

    observer.observe(element);

    return () => {
      if (viewTimer) {
        clearTimeout(viewTimer);
      }
      observer.disconnect();
    };
  }, [postId, enabled]);

  return elementRef;
}
