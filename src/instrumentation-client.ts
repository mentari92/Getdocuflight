import posthog from 'posthog-js';

export const initPostHog = () => {
    if (typeof window !== 'undefined') {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
            person_profiles: 'always', // or 'identified_only'
            capture_pageview: false, // We'll handle this per-page or via middleware if needed, or set to true for autocapture
            loaded: (posthog) => {
                if (process.env.NODE_ENV === 'development') posthog.debug();
            },
        });
    }
};

// Next.js App Router instrumentation hook
export const init = () => {
    initPostHog();
};
