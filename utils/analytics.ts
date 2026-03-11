// lightweight analytics wrapper; defaults to console.log when no provider is configured

import type posthog from 'posthog-js';

type AnalyticsProps = Record<string, unknown>;

interface AnalyticsWindow extends Window {
  posthog?: typeof posthog;
  analytics?: {
    track: (event: string, props?: AnalyticsProps) => void;
  };
}

export function initializeAnalytics() {
  if (typeof window === 'undefined') return;
  const w = window as AnalyticsWindow;
  if (w.posthog || w.analytics) return; // already initialized

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NEXT_PUBLIC_ANALYTICS_KEY;
  if (key) {
    // lazy load posthog-js
    import('posthog-js').then(({ default: ph }) => {
      ph.init(key, { api_host: 'https://app.posthog.com' });
      w.posthog = ph;
      console.log('analytics initialized');
    }).catch((e) => console.error('failed to load analytics', e));
  }
}

export function track(event: string, props?: AnalyticsProps) {
  if (typeof window === 'undefined') return;
  const w = window as AnalyticsWindow;
  if (w.posthog && typeof w.posthog.capture === 'function') {
    w.posthog.capture(event, props);
  } else if (w.analytics && typeof w.analytics.track === 'function') {
    w.analytics.track(event, props);
  } else {
    // fallback during development or if analytics unset
    console.log('[track]', event, props);
  }
}
