/**
 * encryption.test.ts — Unit tests for AES-256-GCM encryption module.
 *
 * Tests encrypt/decrypt roundtrip for both file buffers and master key wrapping.
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
    generateFileKey,
    encryptBuffer,
    decryptBuffer,
    encryptKeyWithMaster,
    decryptKeyFromMaster,
} from "../encryption";

// Set a test master key (64 hex chars = 32 bytes)
beforeAll(() => {
    process.env.ENCRYPTION_MASTER_KEY =
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("encryption", () => {
    describe("generateFileKey", () => {
        it("generates a 32-byte key", () => {
            const key = generateFileKey();
            expect(key).toBeInstanceOf(Buffer);
            expect(key.length).toBe(32);
        });

        it("generates unique keys", () => {
            const key1 = generateFileKey();
            const key2 = generateFileKey();
            expect(key1.equals(key2)).toBe(false);
        });
    });

    describe("encryptBuffer / decryptBuffer", () => {
        it("roundtrips a simple text buffer", () => {
            const key = generateFileKey();
            const plaintext = Buffer.from("Hello, AES-256-GCM!");

            const encrypted = encryptBuffer(plaintext, key);
            expect(encrypted.length).toBeGreaterThan(plaintext.length);

            const decrypted = decryptBuffer(encrypted, key);
            expect(decrypted.toString()).toBe("Hello, AES-256-GCM!");
        });

        it("roundtrips a large binary buffer", () => {
            const key = generateFileKey();
            // Simulate a 1MB file
            const plaintext = Buffer.alloc(1024 * 1024);
            for (let i = 0; i < plaintext.length; i++) {
                plaintext[i] = i % 256;
            }

            const encrypted = encryptBuffer(plaintext, key);
            const decrypted = decryptBuffer(encrypted, key);
            expect(decrypted.equals(plaintext)).toBe(true);
        });

        it("fails decryption with wrong key", () => {
            const key1 = generateFileKey();
            const key2 = generateFileKey();
            const plaintext = Buffer.from("sensitive data");

            const encrypted = encryptBuffer(plaintext, key1);

            expect(() => decryptBuffer(encrypted, key2)).toThrow();
        });

        it("fails decryption if data is tampered", () => {
            const key = generateFileKey();
            const plaintext = Buffer.from("do not tamper");

            const encrypted = encryptBuffer(plaintext, key);
            // Tamper with last byte of ciphertext
            encrypted[encrypted.length - 1] ^= 0xff;

            expect(() => decryptBuffer(encrypted, key)).toThrow();
        });
    });

    describe("encryptKeyWithMaster / decryptKeyFromMaster", () => {
        it("roundtrips a file key through master key wrapping", () => {
            const fileKey = generateFileKey();

            const wrapped = encryptKeyWithMaster(fileKey);
            expect(typeof wrapped).toBe("string");
            expect(wrapped.length).toBeGreaterThan(0);

            const unwrapped = decryptKeyFromMaster(wrapped);
            expect(unwrapped.equals(fileKey)).toBe(true);
        });

        it("produces different ciphertext on each wrap (random IV)", () => {
            const fileKey = generateFileKey();
            const wrapped1 = encryptKeyWithMaster(fileKey);
            const wrapped2 = encryptKeyWithMaster(fileKey);
            expect(wrapped1).not.toBe(wrapped2);
        });
    });
});
