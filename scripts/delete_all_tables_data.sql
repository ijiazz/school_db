-- 清空所有表数据
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema'))
    LOOP
        EXECUTE 'TRUNCATE public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
 