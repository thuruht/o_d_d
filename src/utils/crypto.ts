// src/utils/crypto.ts

/**
 * Hashes a password using the secure PBKDF2 algorithm with a unique random salt.
 * @param password The plaintext password to hash.
 * @returns A promise that resolves to a string containing the salt and hash, formatted as "salt:hash".
 */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    
    // 1. Generate a unique, random salt for this password
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // 2. Derive a key using PBKDF2. This is the "slow" part.
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000, // A high number of iterations makes it slow
            hash: 'SHA-256',
        },
        key,
        256 // 256-bit hash
    );

    // 3. Convert salt and hash to hex strings and combine them for storage
    const saltHex = Buffer.from(salt).toString('hex');
    const hashHex = Buffer.from(hashBuffer).toString('hex');

    return `${saltHex}:${hashHex}`;
}

/**
 * Compares a plaintext password against a stored hash (which includes the salt).
 * @param password The plaintext password from the user.
 * @param storedHash The "salt:hash" string from the database.
 * @returns A promise that resolves to true if the passwords match, false otherwise.
 */
export async function comparePasswords(password: string, storedHash: string): Promise<boolean> {
    const encoder = new TextEncoder();
    
    // 1. Split the stored value into its salt and hash components
    const [saltHex, originalHashHex] = storedHash.split(':');
    if (!saltHex || !originalHashHex) {
        return false; // Invalid stored hash format
    }

    const salt = new Uint8Array(Buffer.from(saltHex, 'hex'));

    // 2. Hash the incoming password using the *exact same* salt and parameters
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        key,
        256
    );
    
    // 3. Compare the newly generated hash with the original one
    const newHashHex = Buffer.from(hashBuffer).toString('hex');
    return newHashHex === originalHashHex;
}