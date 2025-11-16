-- 0002_fix_system_user_password.sql
-- This migration updates the system user's password to a valid hash
-- so that it's possible to log in as the system user in a development environment.

UPDATE users
SET password_hash = '7610c92f35bb7644aebddec90e7f78c4:a3f8ef91651ea9c35f4bee0434108e66b9da4a3c33260c400cc3d7f9681e5fb6'
WHERE email = 'system@odd.map';
