# MySQL → Neon PostgreSQL migration

The original YUVI PHP panel used MySQL. This converted project now uses real PostgreSQL through Neon.

## New database
Run `schema.sql` in the Neon SQL Editor.

## Existing data
If the old cPanel MySQL database already contains production users, panels, keys, referrals, devices, or settings, do not expect `schema.sql` to copy that data. Export the old MySQL data and transform it to PostgreSQL before importing it.

Recommended order:
1. `panels`
2. `users`
3. `referrals`
4. `api_keys`
5. `key_devices`
6. `mod_settings`
7. `mod_maintenance`

The application logic has been changed from MySQL syntax to PostgreSQL syntax, including identity columns, `ON CONFLICT`, PostgreSQL placeholders, and PostgreSQL-safe upserts.
