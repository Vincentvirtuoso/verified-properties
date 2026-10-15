alter table property_images
  add column section text not null default 'general';

alter table properties
  add column declared_document_types text[] not null default '{}',
  add column document_status text not null default 'none'
    check (document_status in ('none', 'declared', 'verified'));