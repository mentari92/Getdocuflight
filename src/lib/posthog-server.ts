import { PostHog } from 'posthog-node';

/**
 * Server-side PostHog Singleton
 * Designed for server components, API routes, and background jobs.
 * Optimized for short-lived sessions (flushAt: 1, flushInterval: 0).
 */
export default function PostHogClient() {
    const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        flushAt: 1,
        flushInterval: 0,
    });

    return posthogClient;
}
