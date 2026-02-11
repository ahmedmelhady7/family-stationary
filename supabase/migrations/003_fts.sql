-- Task 1.3: Arabic full-text search maintenance and helper function
begin;

create or replace function public.search_products_ar(query_text text, limit_count integer default 20)
returns table (
  id uuid,
  name_ar text,
  slug text,
  description_ar text,
  price numeric,
  currency text,
  images text[],
  status text,
  stock_quantity integer,
  rank real
)
language sql
stable
as $$
  select
    p.id,
    p.name_ar,
    p.slug,
    p.description_ar,
    p.price,
    p.currency,
    p.images,
    p.status,
    p.stock_quantity,
    ts_rank_cd(p.fts, plainto_tsquery('arabic', query_text)) as rank
  from public.products p
  where p.status = 'active'
    and p.fts @@ plainto_tsquery('arabic', query_text)
  order by rank desc
  limit greatest(1, least(limit_count, 100));
$$;

commit;
