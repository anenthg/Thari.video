import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | OpenLoom",
  description: "Updates, tutorials, and insights from the OpenLoom team.",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-12">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Back to OpenLoom
          </Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">Blog</h1>
          <p className="mt-2 text-zinc-400">
            Updates, tutorials, and insights on self-hosted screen recording.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-zinc-500">No posts yet. Check back soon!</p>
        ) : (
          <ul className="space-y-8">
            {posts.map((post) => (
              <li key={post.slug}>
                <article className="group">
                  <Link href={`/blog/${post.slug}`}>
                    <time className="text-sm text-zinc-500">
                      {formatDate(post.date)}
                    </time>
                    <h2 className="mt-1 text-xl font-semibold group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-zinc-400 line-clamp-2">
                      {post.description}
                    </p>
                    {post.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
