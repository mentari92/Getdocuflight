import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/blog";
import Logo from "@/components/brand/Logo";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return { title: "Post Not Found" };
    }

    return {
        title: `${post.title} — GetDocuFlight`,
        description: post.excerpt,
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-surface pb-24">
            {/* ═══ Navbar ═══ */}
            <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-primary/10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <Logo />
                        </Link>
                        <Link
                            href="/"
                            className="text-sm font-medium text-muted hover:text-heading transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Header Hero */}
            <div className="bg-primary pt-16 pb-12 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <Link
                        href="/blog"
                        className="inline-flex items-center text-white/80 hover:text-white mb-8 text-sm font-medium transition-colors"
                    >
                        ← Back to Blog
                    </Link>
                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            Visa Guide
                        </span>
                        <time className="text-xs text-white/80" dateTime={post.date}>
                            {new Date(post.date).toLocaleDateString("id-ID", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </time>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white font-heading leading-tight mb-6">
                        {post.title}
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold backdrop-blur-sm">
                            {post.author.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{post.author}</p>
                            <p className="text-xs text-white/80">GetDocuFlight Expert</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <main className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
                <article className="bg-white rounded-3xl shadow-xl shadow-primary/5 p-8 md:p-12 mb-12 border border-gold-border/30">
                    {/* 
                     * Prose classes are from Tailwind Typography plugin.
                     * We simulate it here with custom classes to match GetDocuFlight aesthetic 
                     */}
                    <div
                        className="
                            prose max-w-none
                            prose-headings:font-heading prose-headings:font-bold prose-headings:text-heading
                            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gold-border/30 prose-h2:pb-2
                            prose-p:text-body prose-p:leading-relaxed prose-p:mb-6
                            prose-a:text-primary prose-a:font-medium hover:prose-a:text-primary-dark
                            prose-strong:text-heading prose-strong:font-bold
                            prose-ul:list-disc prose-ul:pl-5 prose-ul:mb-6 prose-ul:text-body
                            prose-ol:list-decimal prose-ol:pl-5 prose-ol:mb-6 prose-ol:text-body
                            prose-li:mb-2
                            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-surface prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:pr-4 prose-blockquote:rounded-r-lg prose-blockquote:text-heading prose-blockquote:italic prose-blockquote:mb-6
                        "
                        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                    />
                </article>

                {/* Footer CTA */}
                <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-8 text-center text-white shadow-xl">
                    <h3 className="text-2xl font-bold font-heading text-white mb-3">
                        Ready to apply for your Visa?
                    </h3>
                    <p className="text-white/90 mb-6 max-w-lg mx-auto">
                        Don't risk a rejection. Predict your chances and get a verified verified flight reservation today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/dashboard"
                            className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-surface transition-colors"
                        >
                            Predict Visa Chances
                        </Link>
                        <Link
                            href="/order"
                            className="px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 backdrop-blur-sm transition-colors"
                        >
                            Get Documentation Assistance
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
