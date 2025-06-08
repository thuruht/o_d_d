import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { C, Env, User, AuthPayload } from '../types';
import { hashPassword, comparePasswords } from '../utils/crypto';
import { createToken, authMiddleware } from '../utils/auth';
import { setCookie, deleteCookie } from 'hono/cookie';

export const authRouter = new Hono<{ Bindings: Env }>();

authRouter.post('/register', async (c: C) => {
    const { username, email, password } = await c.req.json();

    if (!username || !email || !password) {
        return c.json({ error: 'Username, email, and password are required' }, 400);
    }
    if (password.length < 8) {
        return c.json({ error: 'Password must be at least 8 characters long'}, 400);
    }

    try {
        const userId = uuidv4();
        const passwordHash = await hashPassword(password);

        let role: 'admin' | 'user' = 'user';
        const { count } = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>();
        if (count === 0 || email.toLowerCase() === c.env.ADMIN_EMAIL.toLowerCase()) {
            role = 'admin';
        }

        await c.env.DB.prepare(
            'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
        ).bind(userId, username, email.toLowerCase(), passwordHash, role).run();

        return c.json({ message: 'User registered successfully', userId }, 201);
    } catch (e: any) {
        if (e.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'Username or email already exists' }, 409);
        }
        console.error('Registration error:', e);
        return c.json({ error: 'Failed to register user' }, 500);
    }
});

authRouter.post('/login', async (c: C) => {
    const { email, password } = await c.req.json();
    if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400);
    }

    const user = await c.env.DB.prepare(
        'SELECT id, username, password_hash, role, suspended FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first<User>();

    if (!user || !user.password_hash) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    if (user.suspended) {
        return c.json({ error: 'This account has been suspended' }, 403);
    }

    const passwordMatches = await comparePasswords(password, user.password_hash);
    if (!passwordMatches) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const payload: AuthPayload = {
        userId: user.id,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
    };

    if (!c.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured');
        return c.json({ error: 'Server configuration error' }, 500);
    }
    const token = await createToken(payload, c.env.JWT_SECRET);
    
    // Set the token as an HTTP-only cookie
    setCookie(c, 'session', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
        path: '/'
    });

    return c.json({
        message: 'Login successful',
        user: { id: user.id, role: user.role, username: user.username }
        // token no longer sent in response body
    });
});

// Add logout endpoint
authRouter.post('/logout', async (c: C) => {
    // Clear the session cookie
    deleteCookie(c, 'session', {
        httpOnly: true,
        secure: true,
        path: '/'
    });
    
    return c.json({ message: 'Logged out successfully' });
});

authRouter.get('/me', authMiddleware(), async (c: C) => {
    const userPayload = c.get('user');
    const user = await c.env.DB.prepare(
        'SELECT id, username, email, role, created_at FROM users WHERE id = ?'
    ).bind(userPayload.userId).first<Omit<User, 'password_hash'>>();

    if (!user) {
        return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
});