// Create this new file for improved logging
const errorCounts = new Map<string, {count: number, lastLogged: number}>();

export function logError(component: string, message: string, error: any) {
    const key = `${component}:${message}`;
    const now = Date.now();
    const record = errorCounts.get(key) || { count: 0, lastLogged: 0 };
    
    // Only log detailed errors once per minute per error type
    if (now - record.lastLogged > 60000) {
        console.error(`[${component}] ${message}:`, error);
        record.lastLogged = now;
        record.count = 1;
    } else {
        record.count++;
        
        // Log a summary every 10 occurrences
        if (record.count % 10 === 0) {
            console.error(`[${component}] ${message} occurred ${record.count} times in the last minute`);
        }
    }
    
    errorCounts.set(key, record);
}