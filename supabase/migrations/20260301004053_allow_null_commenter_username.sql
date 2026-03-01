-- Allow null usernames in commenters table for deleted Forem accounts.
-- Forem returns null usernames for accounts that have been deleted.
ALTER TABLE commenters ALTER COLUMN username DROP NOT NULL;
