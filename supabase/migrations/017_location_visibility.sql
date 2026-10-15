alter table properties
  add column location_visibility text not null default 'private'
  check (location_visibility in ('public', 'private'));