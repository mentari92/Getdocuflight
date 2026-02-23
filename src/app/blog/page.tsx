import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
    title: "Blog — GetDocuFlight",
    description: "Travel tips, visa guides, and news from GetDocuFlight.",
};

export default function BlogIndexPage() {
    const posts = getAllPosts();

    return (
        <div className="min-h-[80vh] bg-surface pb-24">
            <div className="bg-primary pt-24 pb-16 px-4 mb-12">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white font-heading tracking-tight mb-4">
                        Travel & Visa Guides
                    </h1>
                    <p className="text-white/90 text-lg max-w-2xl mx-auto">
                        Tips, latest news, and complete visa application guides from the GetDocuFlight expert team.
                    </p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4">
                {posts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted">No articles available yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2">
                        {posts.map((post) => (
                            <Link href={`/blog/${post.slug}`} key={post.slug} className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-gold-border/30 shadow-sm hover:shadow-xl hover:border-gold-border transition-all duration-300">
                                {post.coverImage && (
                                    <div className="h-48 w-full bg-surface border-b border-gold-border/20 relative overflow-hidden">
                                        {/* Fallback image style since actual images aren't uploaded yet */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 flex items-center justify-center text-4xl">
                                            ✈️
                                        </div>
                                    </div>
                                )}
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                            Visa Guide
                                        </span>
                                        <time className="text-xs text-muted" dateTime={post.date}>
                                            {new Date(post.date).toLocaleDateString("id-ID", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </time>
                                    </div>
                                    <h2 className="text-xl font-bold text-heading font-heading mb-3 group-hover:text-primary transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-sm text-body leading-relaxed mb-6 flex-1">
                                        {post.excerpt}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gold-border/20">
                                        <span className="text-xs font-medium text-heading">
                                            By {post.author}
                                        </span>
                                        <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                                            Read Article →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
