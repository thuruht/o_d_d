import { createMiddleware } from 'hono/factory';
import { C, AuthPayload, UserRole } from '../types';

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

export const authMiddleware = (requiredRole?: UserRole) => {
    return createMiddleware<C>(async (c, next) => {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ error: 'Unauthorized: Missing token' }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyToken(token, c.env.JWT_SECRET);
        
        if (!payload) {
            return c.json({ error: 'Unauthorized: Invalid token' }, 401);
        }

        const user = await c.env.DB.prepare("SELECT suspended FROM users WHERE id = ?").bind(payload.userId).first<{ suspended: number }>();
        if (!user || user.suspended === 1) {
             return c.json({ error: 'Unauthorized: User account is suspended' }, 403);
        }

        if (requiredRole) {
            const userRole = payload.role;
            const roleHierarchy: Record<UserRole, number> = { 'user': 0, 'moderator': 1, 'admin': 2 };

            if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
                return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
            }
        }

        c.set('user', payload);
        await next();
    });
};