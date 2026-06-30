# Supabase Side-by-Side Migration

Estos SQL preparan Supabase para que convivan:

- La app vieja con Prisma, usando tablas como `"User"`, `"Product"`, `"Sale"`.
- La app nueva NestJS/TypeORM, usando tablas como `users`, `products`, `sales`.

No borran ni renombran tablas viejas.

## Orden

1. Haz backup o snapshot desde Supabase.
2. Ejecuta `000_precheck.sql` para confirmar que existen las tablas viejas de Prisma.
3. Ejecuta `001_create_typeorm_schema.sql`.
4. Ejecuta `002_copy_prisma_data.sql`.
5. Ejecuta `003_validate_counts.sql`.
6. Configura `abr-backend` con `DB_SYNC=false`.

## Donde ejecutarlo

Para Supabase, ejecuta estos archivos desde el SQL Editor o desde una conexion directa/session pooler.
Evita correr migraciones DDL por el transaction pooler/shared pooler cuando sea posible; ese pooler es mejor para la app en runtime.

## Importante

Las tablas viejas usan IDs `cuid()` en texto. Las nuevas usan UUID, por eso el script de copia crea mapas temporales viejo -> nuevo UUID durante la migración.

Después de validar, la app vieja puede seguir usando sus tablas viejas y la app nueva puede leer las tablas nuevas.

Mientras produccion siga usando Prisma, no borres las tablas viejas ni hagas `synchronize=true` contra Supabase.
