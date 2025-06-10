// src/utils/auth.ts
import { Hono } from 'hono';
import { sign, verify } from '@hono/jwt';
import { getCookie } from 'hono/cookie';
import { C, AuthPayload } from '../types';

/**
 * Creates a JWT token using the official @hono/jwt library.
 * @param payload The data to include in the token.
 * @param secret The secret key for signing.
 * @returns A promise that resolves to the JWT string.
 */
export async function createToken(payload: AuthPayload, secret: string): Promise<string> {
    return sign(payload, secret);
}

/**
 * Verifies a JWT token using the official @hono/jwt library.
 * @param token The JWT string to verify.
 * @param secret The secret key for verification.
 * @returns A promise that resolves to the payload if valid, otherwise throws an error.
 */
export async function verifyToken(token: string, secret: string): Promise<AuthPayload> {
    return verify(token, secret);
}

/**
 * Hono middleware to protect routes.
 * It checks for a valid session cookie and sets the user context.
 */
export const requireAuth = async (c: C, next: () => Promise<void>) => {
    const token = getCookie(c, 'session');
    
    if (!token) {
        return c.json({ error: 'Authentication required' }, 401);
    }

    try {
        // The verify function from @hono/jwt will throw an error if the token is invalid or expired.
        const payload = await verifyToken(token, c.env.JWT_SECRET);
        
        c.set('user', payload);
        await next();
    } catch (error) {
        // Catches any error from the verify function (e.g., signature mismatch, expiration).
        return c.json({ error: 'Invalid or expired session' }, 401);
    }
};