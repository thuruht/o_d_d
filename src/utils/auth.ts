import { createMiddleware } from 'hono/factory';
import { C, AuthPayload, UserRole } from '../types';
import { getCookie } from 'hono/cookie';

async function createToken(payload: AuthPayload, secret: string): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=+$/, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=+$/, '');
    
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataToSign));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=+$/, '');

    return `${dataToSign}.${encodedSignature}`;
}

async function verifyToken(token: string, secret: string): Promise<AuthPayload | null> {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );

    try {
        const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(dataToSign));

        if (!isValid) return null;

        const payload = JSON.parse(atob(encodedPayload));
        if (payload.exp < Date.now() / 1000) {
            return null;
        }
        return payload as AuthPayload;
    } catch (e) {
        return null;
    }
}

export { createToken, verifyToken };

export const authMiddleware = () => {
    return async (c: C, next: () => Promise<void>) => {
        const token = getCookie(c, 'session');
        
        if (!token) {
            return c.json({ error: 'Authentication required' }, 401);
        }

        try {
            const payload = await verifyToken(token, c.env.JWT_SECRET);
            
            if (!payload) {
                return c.json({ error: 'Invalid or expired session' }, 401);
            }
            
            c.set('user', payload);
            await next();
        } catch (error) {
            return c.json({ error: 'Invalid or expired session' }, 401);
        }
    };
};