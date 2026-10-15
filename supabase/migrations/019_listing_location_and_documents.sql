alter table properties
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6),
  add column if not exists location_visibility text not null default 'private',
  add column if not exists declared_document_types text[] not null default '{}',
  add column if not exists document_status text not null default 'none';

alter table properties
  drop constraint if exists properties_location_visibility_check,
  add constraint properties_location_visibility_check
    check (location_visibility in ('public', 'private'));

alter table properties
  drop constraint if exists properties_document_status_check,
  add constraint properties_document_status_check
    check (document_status in ('none', 'declared', 'verified'));

alter table property_images
  add column if not exists section text not null default 'general';