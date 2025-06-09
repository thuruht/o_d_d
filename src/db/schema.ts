import { z } from 'zod';

// Define schema for user profile validation
export const UserProfile = z.object({
  bio: z.string().optional(),
  website: z.string().optional(),
  contact: z.string().optional(),
  avatar_url: z.string().optional()
});

// Table definitions for use with drizzle-orm
export const users = {
  id: 'id',
  username: 'username',
  email: 'email',
  password_hash: 'password_hash',
  role: 'role',
  created_at: 'created_at',
  suspended: 'suspended',
  bio: 'bio',
  website: 'website',
  contact: 'contact',
  avatar_url: 'avatar_url'
};

export const locations = {
  id: 'id',
  name: 'name',
  description: 'description',
  latitude: 'latitude',
  longitude: 'longitude',
  type: 'type',
  status: 'status',
  created_by: 'created_by',
  created_at: 'created_at',
  properties: 'properties'
};

export const submissions = {
  id: 'id',
  user_id: 'user_id',
  location_id: 'location_id',
  submission_type: 'submission_type',
  data: 'data',
  status: 'status',
  created_at: 'created_at',
  admin_notes: 'admin_notes'
};

export const reports = {
  id: 'id',
  reporter_id: 'reporter_id',
  location_id: 'location_id',
  reason: 'reason',
  notes: 'notes',
  status: 'status',
  created_at: 'created_at',
  resolved_at: 'resolved_at',
  resolved_by: 'resolved_by'
};