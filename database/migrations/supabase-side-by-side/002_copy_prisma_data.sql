-- Copy old Prisma/Nuxt data into new NestJS/TypeORM tables.
-- This script assumes 001_create_typeorm_schema.sql was already executed.
-- It is side-by-side: it reads quoted Prisma tables and writes lower-case
-- TypeORM tables. It does not delete or rename old tables.

begin;

create temp table map_users (
  old_id text primary key,
  new_id uuid not null
) on commit drop;

create temp table map_products (
  old_id text primary key,
  new_id uuid not null
) on commit drop;

create temp table map_cash_sessions (
  old_id text primary key,
  new_id uuid not null
) on commit drop;

create temp table map_sales (
  old_id text primary key,
  new_id uuid not null
) on commit drop;

create temp table map_held_tickets (
  old_id text primary key,
  new_id uuid not null
) on commit drop;

insert into map_users (old_id, new_id)
select u.id, coalesce(nu.id, gen_random_uuid())
from "User" u
left join users nu on nu.email = u.email
on conflict (old_id) do nothing;

insert into users (
  id,
  "fullName",
  email,
  username,
  "passwordHash",
  phone,
  role,
  active
)
select
  mu.new_id,
  u."fullName",
  u.email,
  u.username,
  u."passwordHash",
  u.phone,
  u.role::text::users_role_enum,
  u.active
from "User" u
join map_users mu on mu.old_id = u.id
on conflict (email) do update set
  "fullName" = excluded."fullName",
  username = excluded.username,
  "passwordHash" = excluded."passwordHash",
  phone = excluded.phone,
  role = excluded.role,
  active = excluded.active;

insert into map_products (old_id, new_id)
select p.id, coalesce(np.id, gen_random_uuid())
from "Product" p
left join products np on np.sku = p.sku
on conflict (old_id) do nothing;

insert into products (
  id,
  sku,
  name,
  description,
  "costPrice",
  "profitMargin",
  price,
  unit,
  stock,
  active,
  "createdAt",
  "updatedAt"
)
select
  mp.new_id,
  p.sku,
  p.name,
  p.description,
  p."costPrice",
  p."profitMargin",
  p.price,
  p.unit::text::products_unit_enum,
  p.stock,
  p.active,
  p."createdAt",
  p."updatedAt"
from "Product" p
join map_products mp on mp.old_id = p.id
on conflict (sku) do update set
  name = excluded.name,
  description = excluded.description,
  "costPrice" = excluded."costPrice",
  "profitMargin" = excluded."profitMargin",
  price = excluded.price,
  unit = excluded.unit,
  stock = excluded.stock,
  active = excluded.active,
  "updatedAt" = excluded."updatedAt";

insert into map_cash_sessions (old_id, new_id)
select cs.id, coalesce(ncs.id, gen_random_uuid())
from "CashRegisterSession" cs
left join cash_register_sessions ncs
  on ncs."openedAt" = cs."openedAt"
  and ncs."openedById" = (select new_id from map_users where old_id = cs."openedById")
on conflict (old_id) do nothing;

insert into cash_register_sessions (
  id,
  status,
  "openingAmount",
  "closingAmount",
  "expectedAmount",
  difference,
  "openedById",
  "closedById",
  notes,
  "openedAt",
  "closedAt"
)
select
  mcs.new_id,
  cs.status::text::cash_register_sessions_status_enum,
  cs."openingAmount",
  cs."closingAmount",
  cs."expectedAmount",
  cs.difference,
  ou.new_id,
  cu.new_id,
  cs.notes,
  cs."openedAt",
  cs."closedAt"
from "CashRegisterSession" cs
join map_cash_sessions mcs on mcs.old_id = cs.id
join map_users ou on ou.old_id = cs."openedById"
left join map_users cu on cu.old_id = cs."closedById"
on conflict (id) do nothing;

insert into cash_movements (
  id,
  "cashSessionId",
  "createdById",
  type,
  amount,
  description,
  "createdAt"
)
select
  gen_random_uuid(),
  mcs.new_id,
  mu.new_id,
  cm.type::text::cash_movements_type_enum,
  cm.amount,
  cm.description,
  cm."createdAt"
from "CashMovement" cm
join map_cash_sessions mcs on mcs.old_id = cm."cashSessionId"
join map_users mu on mu.old_id = cm."createdById"
where not exists (
  select 1
  from cash_movements existing
  where existing."cashSessionId" = mcs.new_id
    and existing."createdById" = mu.new_id
    and existing.type::text = cm.type::text
    and existing.amount = cm.amount
    and existing.description = cm.description
    and existing."createdAt" = cm."createdAt"
);

insert into map_sales (old_id, new_id)
select s.id, coalesce(ns.id, gen_random_uuid())
from "Sale" s
left join sales ns on ns.folio = s.folio
on conflict (old_id) do nothing;

insert into sales (
  id,
  folio,
  total,
  "paymentTotal",
  "itemCount",
  "paymentMethod",
  "cashReceived",
  "changeDue",
  "sellerId",
  "cashSessionId",
  "canceledAt",
  "canceledById",
  "cancelReason",
  "creditPaidAt",
  "creditPaidById",
  "creditPaymentMethod",
  "creditCustomerName",
  "creditNote",
  "createdAt"
)
select
  ms.new_id,
  s.folio,
  s.total,
  s."paymentTotal",
  s."itemCount",
  s."paymentMethod"::text::sales_paymentmethod_enum,
  s."cashReceived",
  s."changeDue",
  seller.new_id,
  mcs.new_id,
  s."canceledAt",
  canceled.new_id,
  s."cancelReason",
  s."creditPaidAt",
  paid.new_id,
  case when s."creditPaymentMethod" is null then null else s."creditPaymentMethod"::text::sales_paymentmethod_enum end,
  s."creditCustomerName",
  s."creditNote",
  s."createdAt"
from "Sale" s
join map_sales ms on ms.old_id = s.id
join map_users seller on seller.old_id = s."sellerId"
left join map_cash_sessions mcs on mcs.old_id = s."cashSessionId"
left join map_users canceled on canceled.old_id = s."canceledById"
left join map_users paid on paid.old_id = s."creditPaidById"
on conflict (folio) do update set
  total = excluded.total,
  "paymentTotal" = excluded."paymentTotal",
  "itemCount" = excluded."itemCount",
  "paymentMethod" = excluded."paymentMethod",
  "cashReceived" = excluded."cashReceived",
  "changeDue" = excluded."changeDue",
  "sellerId" = excluded."sellerId",
  "cashSessionId" = excluded."cashSessionId",
  "canceledAt" = excluded."canceledAt",
  "canceledById" = excluded."canceledById",
  "cancelReason" = excluded."cancelReason",
  "creditPaidAt" = excluded."creditPaidAt",
  "creditPaidById" = excluded."creditPaidById",
  "creditPaymentMethod" = excluded."creditPaymentMethod",
  "creditCustomerName" = excluded."creditCustomerName",
  "creditNote" = excluded."creditNote";

insert into sale_items (
  id,
  "saleId",
  "productId",
  sku,
  name,
  description,
  unit,
  quantity,
  "unitPrice",
  "lineTotal",
  "canceledAt",
  "cancelReason"
)
select
  gen_random_uuid(),
  ms.new_id,
  mp.new_id,
  si.sku,
  si.name,
  si.description,
  si.unit::text::sale_items_unit_enum,
  si.quantity,
  si."unitPrice",
  si."lineTotal",
  si."canceledAt",
  si."cancelReason"
from "SaleItem" si
join map_sales ms on ms.old_id = si."saleId"
left join map_products mp on mp.old_id = si."productId"
where not exists (
  select 1
  from sale_items existing
  where existing."saleId" = ms.new_id
    and existing.sku = si.sku
    and existing.name = si.name
    and existing.quantity = si.quantity
    and existing."lineTotal" = si."lineTotal"
    and coalesce(existing."canceledAt", timestamp 'epoch') = coalesce(si."canceledAt", timestamp 'epoch')
);

insert into map_held_tickets (old_id, new_id)
select ht.id, coalesce(nht.id, gen_random_uuid())
from "HeldTicket" ht
left join held_tickets nht
  on nht."createdAt" = ht."createdAt"
  and nht."createdById" = (select new_id from map_users where old_id = ht."createdById")
on conflict (old_id) do nothing;

insert into held_tickets (
  id,
  note,
  "itemCount",
  total,
  "paymentMethod",
  "cashSessionId",
  "createdById",
  "createdAt",
  "updatedAt"
)
select
  mht.new_id,
  ht.note,
  ht."itemCount",
  ht.total,
  ht."paymentMethod"::text::held_tickets_paymentmethod_enum,
  mcs.new_id,
  mu.new_id,
  ht."createdAt",
  ht."updatedAt"
from "HeldTicket" ht
join map_held_tickets mht on mht.old_id = ht.id
join map_cash_sessions mcs on mcs.old_id = ht."cashSessionId"
join map_users mu on mu.old_id = ht."createdById"
on conflict (id) do nothing;

insert into held_ticket_items (
  id,
  "heldTicketId",
  "productId",
  sku,
  name,
  description,
  unit,
  quantity,
  "unitPrice",
  "lineTotal"
)
select
  gen_random_uuid(),
  mht.new_id,
  mp.new_id,
  hti.sku,
  hti.name,
  hti.description,
  hti.unit::text::held_ticket_items_unit_enum,
  hti.quantity,
  hti."unitPrice",
  hti."lineTotal"
from "HeldTicketItem" hti
join map_held_tickets mht on mht.old_id = hti."heldTicketId"
left join map_products mp on mp.old_id = hti."productId"
where not exists (
  select 1
  from held_ticket_items existing
  where existing."heldTicketId" = mht.new_id
    and existing.sku = hti.sku
    and existing.name = hti.name
    and existing.quantity = hti.quantity
    and existing."lineTotal" = hti."lineTotal"
);

insert into stock_exits (
  id,
  "productId",
  "userId",
  reason,
  sku,
  name,
  description,
  unit,
  quantity,
  note,
  "createdAt"
)
select
  gen_random_uuid(),
  mp.new_id,
  mu.new_id,
  se.reason::text::stock_exits_reason_enum,
  se.sku,
  se.name,
  se.description,
  se.unit::text::stock_exits_unit_enum,
  se.quantity,
  se.note,
  se."createdAt"
from "StockExit" se
left join map_products mp on mp.old_id = se."productId"
join map_users mu on mu.old_id = se."userId"
where not exists (
  select 1
  from stock_exits existing
  where existing."userId" = mu.new_id
    and existing.sku = se.sku
    and existing.reason::text = se.reason::text
    and existing.quantity = se.quantity
    and existing."createdAt" = se."createdAt"
);

select setval(
  pg_get_serial_sequence('sales', 'folio'),
  greatest(coalesce((select max(folio) from sales), 1), 1),
  true
)
where pg_get_serial_sequence('sales', 'folio') is not null;

commit;

