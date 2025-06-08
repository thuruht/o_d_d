import { D1Database, R2Bucket, Fetcher } from '@cloudflare/workers-types';
import { Context as HonoContext } from 'hono';

export type UserRole = 'user' | 'moderator' | 'admin';

export type LocationType =
    | 'established-campground' | 'informal-campsite' | 'wild-camping'
    | 'scenic-viewpoint' | 'day-use-picnic'
    | 'hotel' | 'hostel' | 'restaurant'
    | 'mechanic' | 'fuel' | 'propane' | 'water' | 'dump-station' | 'laundry' | 'showers'
    | 'wifi-spot' | 'tourist-attraction' | 'shopping' | 'medical' | 'pet-services'
    | 'border-crossing' | 'checkpoint' | 'warning' | 'other';

export interface LocationProperties {
    wifi: 'yes' | 'no' | 'paid';
    cellular: 'none' | '1g/2g' | '3g' | '4g/lte' | '5g';
    toilets: 'none' | 'flush' | 'vault' | 'pit' | 'portable';
    showers: 'none' | 'hot' | 'cold' | 'paid';
    water: 'none' | 'tap-potable' | 'tap-non-potable' | 'fountain' | 'natural-source';
    power: 'none' | '110v' | '220v' | 'usb';
    pet_friendly: boolean;
    tent_friendly: boolean;
    opens_24_7: boolean;
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    password_hash?: string;
    created_at: string;
    suspended: number;
    bio?: string;
    website?: string;
    contact?: string;
    avatar_url?: string;
}

export interface Location {
    id: string;
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    type: LocationType;
    status: 'pending' | 'approved' | 'rejected';
    created_by: string;
    created_at: string;
    properties: Partial<LocationProperties>;
    average_rating?: number | null;
    total_votes?: number;
    media?: Media[];
    votes?: Vote[];
    creator_username?: string;
    creator_avatar_url?: string;
    is_favorite?: boolean;
}

export interface Media {
    id: string;
    location_id: string;
    user_id: string;
    r2_key: string;
    url?: string;
    type: 'image' | 'video';
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    uploader_username?: string;
}

export interface Submission {
    id: string;
    user_id: string;
    location_id?: string;
    submission_type: 'new' | 'edit';
    data: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    admin_notes?: string;
    submitter_username?: string;
}

export interface Vote {
    id: string;
    user_id: string;
    location_id: string;
    value: number;
    comment?: string;
    created_at: string;
    voter_username?: string;
    voter_avatar_url?: string;
}

export interface Report {
    id: string;
    reporter_id: string;
    location_id?: string;
    media_id?: string;
    vote_id?: string;
    reason: string;
    notes?: string;
    status: 'open' | 'resolved' | 'dismissed';
    created_at: string;
    resolved_at?: string;
    resolved_by?: string;
    reporter_username?: string;
    resolver_username?: string;
}

export interface Favorite {
    user_id: string;
    location_id: string;
    created_at: string;
}

export interface AuthPayload {
    userId: string;
    role: UserRole;
    exp: number;
}

export interface Env {
    ASSETS: Fetcher;
    DB: D1Database;
    MEDIA_BUCKET: R2Bucket;
    JWT_SECRET: string;
    ADMIN_EMAIL: string;
    R2_PUBLIC_URL: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_ENDPOINT: string;
}

export type C = HonoContext<{ Bindings: Env, Variables: { user: AuthPayload } }>;
