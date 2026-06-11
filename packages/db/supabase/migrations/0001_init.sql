-- 0001_init — extensions, schemas, and the zone roles (§3.3).
-- Forward-only. Numbered. Do not edit a migration after it has shipped; add a new one.

create extension if not exists citext;
create extension if not exists pgcrypto; -- gen_random_uuid(), digest() for SHA-256

create schema if not exists identity;
create schema if not exists ballotbox;
create schema if not exists credauth;

-- ---------------------------------------------------------------------------
-- Zone roles. NOLOGIN: used for grant scoping and SET ROLE in pgTAP. The two
-- application zones can never read each other's data; the credential-authority
-- zone is readable by neither application role (redline Edit A / INV-1, INV-10).
--
-- ecclesia_ballotbox_owner owns the SECURITY DEFINER ballot/audit functions so
-- they (and only they) may perform the is_replaced/replaced_by transition and
-- the audit insert — the carve-out in INV-4.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select from pg_roles where rolname = 'app_identity') then
    create role app_identity nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'app_ballotbox') then
    create role app_ballotbox nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'app_credauth') then
    create role app_credauth nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'ecclesia_ballotbox_owner') then
    create role ecclesia_ballotbox_owner nologin;
  end if;
end
$$;

grant usage on schema identity to app_identity;
grant usage on schema ballotbox to app_ballotbox, ecclesia_ballotbox_owner;
grant usage on schema credauth to app_credauth;

-- Supabase's PostgREST roles get schema usage but per-table grants are withheld
-- below; they reach data only through explicitly granted views / RPCs.
grant usage on schema identity, ballotbox to anon, authenticated;
