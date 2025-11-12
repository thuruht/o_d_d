
-- Seed System User and Sample Locations

-- 1. Upsert System User
-- This query will insert the system user if it does not exist.
-- The user ID is deterministic to avoid creating duplicate users.
INSERT OR IGNORE INTO users (id, username, email, role, password_hash)
VALUES ('00000000-0000-0000-0000-000000000000', 'system', 'system@odd.map', 'admin', 'system_user_no_login');

-- 2. Add Sample Locations
-- This section adds a few real-world sample locations for testing purposes.
-- These locations are created by the system user.

-- Location 1: A well-known overlanding spot in Moab, Utah
INSERT INTO locations (id, name, description, latitude, longitude, type, properties, created_by, status)
VALUES (
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    'Shafer Trail Viewpoint',
    'Iconic viewpoint overlooking the Shafer Trail switchbacks in Canyonlands National Park. A popular spot for photos.',
    38.4743,
    -109.8242,
    'scenic-viewpoint',
    '{"toilets": "vault", "pet_friendly": true}',
    '00000000-0000-0000-0000-000000000000',
    'approved'
);

-- Location 2: A wild camping spot in the Rocky Mountains
INSERT INTO locations (id, name, description, latitude, longitude, type, properties, created_by, status)
VALUES (
    'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
    'Guanella Pass Dispersed Camping',
    'Beautiful dispersed camping area along Guanella Pass Road. Great access to hiking trails and stunning mountain views.',
    39.5985,
    -105.7597,
    'wild-camping',
    '{"toilets": "none", "pet_friendly": true}',
    '00000000-0000-0000-0000-000000000000',
    'approved'
);

-- Location 3: A mechanic in South America known for helping overlanders
INSERT INTO locations (id, name, description, latitude, longitude, type, properties, created_by, status)
VALUES (
    'c3d4e5f6-a7b8-9012-3456-7890abcdef12',
    'Taller de Alberto',
    'A friendly and reliable mechanic in Villa O''Higgins, Chile, who is well-known for helping overlanders with vehicle repairs.',
    -48.4684,
    -72.5583,
    'mechanic',
    '{}',
    '00000000-0000-0000-0000-000000000000',
    'approved'
);
