// src/utils/auth.ts
import { getCookie } from 'hono/cookie';
import { C, AuthPayload } from '../types';

/**
 * Creates a JWT token using native Web Crypto API.
 */
export async function sign(payload: AuthPayload, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const header = { alg: 'HS256', typ: 'JWT' };
    
    const headerBase64 = btoa(JSON.stringify(header));
    const payloadBase64 = btoa(JSON.stringify(payload));
    
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign(
        { name: 'HMAC' },
        key,
        encoder.encode(`${headerBase64}.${payloadBase64}`)
    );
    
    const signatureBase64 = btoa(
        Array.from(new Uint8Array(signature), byte => 
            String.fromCharCode(byte)).join('')
    );
    
    return `${headerBase64}.${payloadBase64}.${signatureBase64}`;
}

/**
 * Verifies a JWT token.
 */
export async function verify(token: string, secret: string): Promise<AuthPayload> {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid token format');
    }
    
    const [headerBase64, payloadBase64, signatureBase64] = parts;
    const encoder = new TextEncoder();
    
    // Verify signature
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );
    
    const signatureArray = new Uint8Array(
        atob(signatureBase64).split('').map(c => c.charCodeAt(0))
    );
    
    const valid = await crypto.subtle.verify(
        { name: 'HMAC' },
        key,
        signatureArray,
        encoder.encode(`${headerBase64}.${payloadBase64}`)
    );
    
    if (!valid) {
        throw new Error('Invalid token signature');
    }
    
    // Decode payload
    const payload = JSON.parse(atob(payloadBase64)) as AuthPayload;
    
    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token has expired');
    }
    
    return payload;
}

// Now define your existing functions that use sign and verify
export async function createToken(payload: AuthPayload, secret: string): Promise<string> {
    return sign(payload, secret);
}

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

/**
 * Middleware to check authentication and optionally verify user roles.
 * Similar to requireAuth but with role-based access control.
 * 
 * @param requiredRole Optional role requirement (admin, moderator)
 * @returns Middleware function that verifies auth and role
 */
export const authMiddleware = (requiredRole?: 'admin' | 'moderator') => {
    return async (c: C, next: () => Promise<void>) => {
        const token = getCookie(c, 'session');
        
        if (!token) {
            return c.json({ error: 'Authentication required' }, 401);
        }

        try {
            const payload = await verifyToken(token, c.env.JWT_SECRET);
            
            // Role check if a specific role is required
            if (requiredRole) {
                if (requiredRole === 'admin' && payload.role !== 'admin') {
                    return c.json({ error: 'Admin privileges required' }, 403);
                }
                
                if (requiredRole === 'moderator' && 
                    payload.role !== 'admin' && 
                    payload.role !== 'moderator') {
                    return c.json({ error: 'Moderator privileges required' }, 403);
                }
            }
            
            c.set('user', payload);
            await next();
        } catch (error) {
            return c.json({ error: 'Invalid or expired session' }, 401);
        }
    };
};