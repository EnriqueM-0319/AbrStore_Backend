-- Run after 002_copy_prisma_data.sql to compare old Prisma table counts
-- against the new TypeORM table counts.

select 'users' as entity, (select count(*) from "User") as old_count, (select count(*) from users) as new_count
union all
select 'products', (select count(*) from "Product"), (select count(*) from products)
union all
select 'cash_register_sessions', (select count(*) from "CashRegisterSession"), (select count(*) from cash_register_sessions)
union all
select 'cash_movements', (select count(*) from "CashMovement"), (select count(*) from cash_movements)
union all
select 'sales', (select count(*) from "Sale"), (select count(*) from sales)
union all
select 'sale_items', (select count(*) from "SaleItem"), (select count(*) from sale_items)
union all
select 'held_tickets', (select count(*) from "HeldTicket"), (select count(*) from held_tickets)
union all
select 'held_ticket_items', (select count(*) from "HeldTicketItem"), (select count(*) from held_ticket_items)
union all
select 'stock_exits', (select count(*) from "StockExit"), (select count(*) from stock_exits);

