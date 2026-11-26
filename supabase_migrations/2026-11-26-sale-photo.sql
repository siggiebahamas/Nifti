-- Round 79: an optional photo on a walk-in sale (e.g. proof of an utang: the person, an ID or a signed note).
-- Additive only. The picture itself goes in the existing private "receipts" bucket under the business's folder.
alter table public.downstream_sales add column if not exists photo_path text;
