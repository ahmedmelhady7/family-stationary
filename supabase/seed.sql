begin;

insert into public.categories (id, name_ar, slug, sort_order)
values
  ('7be8fdb1-e724-4d03-a6a7-17339c09db11', 'أقلام', 'pens', 1),
  ('652c3944-5d9d-4d4f-b155-3fdb95ad6a1a', 'دفاتر', 'notebooks', 2),
  ('07c3e95c-0299-498e-a4f5-0d2d40fb7f98', 'أدوات مدرسية', 'school-tools', 3)
on conflict (id) do update
set name_ar = excluded.name_ar,
    slug = excluded.slug,
    sort_order = excluded.sort_order;

insert into public.products (
  id,
  name_ar,
  slug,
  description_ar,
  price,
  currency,
  images,
  category_id,
  status,
  stock_quantity,
  is_featured,
  source_type
)
values
  ('2aa8537b-cc0e-4ef7-b576-f6f730f486af', 'قلم حبر أزرق فاخر', 'luxury-blue-ink-pen', 'قلم يومي مريح للكتابة بسلاسة عالية.', 35, 'EGP', array['/assets/icons/lantern.svg'], '7be8fdb1-e724-4d03-a6a7-17339c09db11', 'active', 42, true, 'manual_whatsapp'),
  ('cda0574f-1995-4438-a270-4e502f7a0f30', 'قلم جاف أسود', 'black-ballpoint-pen', 'عبوة اقتصادية للاستخدام المدرسي.', 18, 'EGP', array['/assets/icons/lantern.svg'], '7be8fdb1-e724-4d03-a6a7-17339c09db11', 'active', 120, false, 'link'),
  ('ae0f8960-6af5-45ef-b8d2-3825abfacc9b', 'دفتر ملاحظات A5', 'notebook-a5', 'دفتر 200 صفحة بغلاف متين.', 55, 'EGP', array['/assets/icons/lantern.svg'], '652c3944-5d9d-4d4f-b155-3fdb95ad6a1a', 'active', 84, true, 'manual_whatsapp'),
  ('4e73c056-bdb4-402d-9f18-3e1f5a943326', 'دفتر رسم كبير', 'sketchbook-large', 'ورق سميك مناسب للألوان والأقلام.', 78, 'EGP', array['/assets/icons/lantern.svg'], '652c3944-5d9d-4d4f-b155-3fdb95ad6a1a', 'active', 33, false, 'link'),
  ('e5e77d4d-d3f8-47d0-a6ea-b5d1021bcf53', 'مبراة معدنية', 'metal-sharpener', 'مبراة قوية بعلبة تجميع.', 22, 'EGP', array['/assets/icons/lantern.svg'], '07c3e95c-0299-498e-a4f5-0d2d40fb7f98', 'active', 70, true, 'manual_whatsapp'),
  ('3445f192-b3ab-40b5-9753-4bd272f9a95f', 'علبة ألوان خشبية', 'wood-colored-pencils', 'علبة 24 لون بجودة ممتازة.', 95, 'EGP', array['/assets/icons/lantern.svg'], '07c3e95c-0299-498e-a4f5-0d2d40fb7f98', 'active', 12, false, 'link'),
  ('312da95d-a860-4f3b-a69f-96fbe102fa69', 'قلم تحديد أصفر', 'yellow-highlighter', 'سطوع عالٍ للحفظ والمذاكرة.', 25, 'EGP', array['/assets/icons/lantern.svg'], '7be8fdb1-e724-4d03-a6a7-17339c09db11', 'active', 0, false, 'manual_whatsapp'),
  ('8ab9dc24-8da2-42b8-bf61-b93aa59f1fd9', 'دفتر مربعات', 'grid-notebook', 'مثالي للرياضيات والهندسة.', 43, 'EGP', array['/assets/icons/lantern.svg'], '652c3944-5d9d-4d4f-b155-3fdb95ad6a1a', 'active', 58, false, 'link'),
  ('8adf759c-9f84-41e7-a9a5-c8bd5fff9fb6', 'مسطرة شفافة 30 سم', 'ruler-30cm', 'مسطرة متينة ومدرجة بوضوح.', 16, 'EGP', array['/assets/icons/lantern.svg'], '07c3e95c-0299-498e-a4f5-0d2d40fb7f98', 'active', 95, false, 'manual_whatsapp'),
  ('6fe4ef67-6e5e-43c0-b917-f6974ee05a6f', 'حقيبة أدوات هندسية', 'geometry-kit', 'تحتوي على فرجار ومثلثات وممحاة.', 110, 'EGP', array['/assets/icons/lantern.svg'], '07c3e95c-0299-498e-a4f5-0d2d40fb7f98', 'active', 26, true, 'link')
on conflict (id) do update
set name_ar = excluded.name_ar,
    slug = excluded.slug,
    description_ar = excluded.description_ar,
    price = excluded.price,
    currency = excluded.currency,
    images = excluded.images,
    category_id = excluded.category_id,
    status = excluded.status,
    stock_quantity = excluded.stock_quantity,
    is_featured = excluded.is_featured,
    source_type = excluded.source_type;

commit;
