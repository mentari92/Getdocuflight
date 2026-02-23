/**
 * GetDocuFlight Type-safe Analytics Events
 * Following BMAD Principles: SOLID, DRY, Robust.
 */

export const ANALYTICS_EVENTS = {
    // Conversion Funnel: Smart Navigator
    SMART_NAVIGATOR_SEARCH: 'smart_navigator_search',

    // Conversion Funnel: Order Form
    ORDER_FORM_VIEWED: 'order_form_viewed',
    ORDER_FORM_SUBMITTED: 'order_form_submitted',

    // Conversion Funnel: Payment
    PAYMENT_INITIATED: 'payment_initiated',
    PAYMENT_COMPLETED: 'payment_completed',
    PAYMENT_FAILED: 'payment_failed',

    // Core Product: AI Predictor
    PREDICTION_CREATED: 'prediction_created',
    PREDICTION_UNLOCKED: 'prediction_unlocked',
    DOCUMENT_UPLOADED: 'document_uploaded',

    // Authentication
    USER_SIGNED_UP: 'user_signed_up',
    USER_LOGGED_IN: 'user_logged_in',
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

/**
 * Common properties for events to ensure consistency
 */
export interface BaseEventProperties {
    source?: string;
    path?: string;
    [key: string]: any;
}
