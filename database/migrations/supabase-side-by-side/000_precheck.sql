-- Run before the side-by-side migration.
-- It only reads metadata and counts rows; it does not change data.

with expected_tables(table_name, expected_kind) as (
  values
    ('User', 'old_prisma'),
    ('Product', 'old_prisma'),
    ('CashRegisterSession', 'old_prisma'),
    ('CashMovement', 'old_prisma'),
    ('Sale', 'old_prisma'),
    ('SaleItem', 'old_prisma'),
    ('HeldTicket', 'old_prisma'),
    ('HeldTicketItem', 'old_prisma'),
    ('StockExit', 'old_prisma'),
    ('users', 'new_typeorm'),
    ('products', 'new_typeorm'),
    ('cash_register_sessions', 'new_typeorm'),
    ('cash_movements', 'new_typeorm'),
    ('sales', 'new_typeorm'),
    ('sale_items', 'new_typeorm'),
    ('held_tickets', 'new_typeorm'),
    ('held_ticket_items', 'new_typeorm'),
    ('stock_exits', 'new_typeorm')
)
select
  expected_kind,
  table_name,
  exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and information_schema.tables.table_name = expected_tables.table_name
  ) as exists_in_public
from expected_tables
order by expected_kind, table_name;

select 'User' as table_name, count(*) as rows from "User"
union all
select 'Product', count(*) from "Product"
union all
select 'CashRegisterSession', count(*) from "CashRegisterSession"
union all
select 'CashMovement', count(*) from "CashMovement"
union all
select 'Sale', count(*) from "Sale"
union all
select 'SaleItem', count(*) from "SaleItem"
union all
select 'HeldTicket', count(*) from "HeldTicket"
union all
select 'HeldTicketItem', count(*) from "HeldTicketItem"
union all
select 'StockExit', count(*) from "StockExit";
