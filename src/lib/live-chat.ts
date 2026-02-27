"use client";

/**
 * Utility to toggle the live chat from anywhere in the client side.
 * Uses custom events to avoid complex state management.
 */

export const toggleLiveChat = (open?: boolean) => {
    const event = new CustomEvent("toggle-live-chat", {
        detail: { open: open ?? true }
    });
    window.dispatchEvent(event);
};
