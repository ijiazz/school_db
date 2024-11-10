SET client_encoding = 'UTF8';

CREATE OR REPLACE FUNCTION resource_operate(table_name VARCHAR, uri VARCHAR, op CHAR)
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    IF(uri IS NOT NULL) THEN
        EXECUTE 'UPDATE '||table_name||' SET ref_count = ref_count '||op||' 1 WHERE uri = '''||uri||'''';
        GET DIAGNOSTICS count = ROW_COUNT;
    ELSE
        count := 0;
    END IF;
    RETURN count;
END; $$ LANGUAGE PLPGSQL;

CREATE OR REPLACE FUNCTION resource_operate(table_name VARCHAR, uri_list VARCHAR[], op CHAR)
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    IF(array_length(uri_list, 1) IS NOT NULL) THEN
        EXECUTE 'UPDATE '||table_name||' SET ref_count = ref_count '||op||' 1 WHERE uri IN ('''|| array_to_string(uri_list,''', ''')||''')';
        GET DIAGNOSTICS count = ROW_COUNT;
    ELSE
        count := 0;
    END IF;
    RETURN count;
END; $$ LANGUAGE PLPGSQL;

-- 根据新旧值处理资源引用数量的更新
CREATE OR REPLACE FUNCTION res_update_operate(old VARCHAR, new VARCHAR, table_name VARCHAR)
RETURNS INTEGER AS $$
DECLARE 
    count INTEGER; 
BEGIN
    IF(old = new) THEN RETURN 0;
    END IF;

    IF(new IS NULL) THEN
        RETURN resource_operate(table_name, old, '-');
    ELSEIF(old IS NULL) THEN
        RETURN resource_operate(table_name, new, '+');
    END IF; 


    count := resource_operate(table_name, new, '+');
    count := count + resource_operate(table_name, old, '-');

    RETURN count;
END; $$ LANGUAGE plpgsql;

-- 根据新旧值处理资源引用数量的更新
CREATE OR REPLACE FUNCTION res_update_operate(old VARCHAR[], new VARCHAR[], table_name VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    need_add VARCHAR[];
    need_sub VARCHAR[];
    t_size INTEGER;
    elem VARCHAR;
    count INTEGER;
BEGIN
    old :=array_remove(old, NULL);
    new :=array_remove(new, NULL);

    IF(old = new) THEN RETURN 0;
    END IF;
    IF(array_length(new, 1) IS NULL) THEN
        RETURN resource_operate(table_name, old, '-');
    END IF;

    IF(array_length(old, 1) IS NULL) THEN
        RETURN resource_operate(table_name, new, '+');
    END IF;
    
    count :=0;
    need_add := '{}';

    FOREACH elem IN ARRAY new LOOP
        -- 如果元素不在第二个数组中，则添加到差集数组
        t_size :=array_length(old, 1);
        old :=array_remove(old, elem);

        IF(array_length(old, 1) = t_size) THEN 
            need_add :=array_append(need_add,elem);
        END IF;
    END LOOP;
    need_sub :=old;


    count := count + resource_operate(table_name, need_add, '+');
    count := count + resource_operate(table_name, need_sub, '-');

    RETURN count;
END; $$ LANGUAGE plpgsql;

-- 数组外键约束 - VARCHAR
/* CREATE OR REPLACE FUNCTION array_fk_check(f_table_name VARCHAR, fk VARCHAR, value VARCHAR[])RETURNS VOID AS $$
DECLARE 
    t_size INTEGER;
BEGIN
    IF(fk IS NULL OR value IS NULL) THEN RETURN;
    END IF;
    EXECUTE 'SELECT count(*) FROM '||f_table_name||' WHERE '||fk||' IN ('''||array_to_string(value, ''',''')||''')' INTO t_size;
    IF(array_length(value, 1) != t_size) THEN
        RAISE '违反 % 表的 % 数组外键约束', f_table_name, fk;
    END IF;
    RETURN;
END; $$ LANGUAGE plpgsql; */

CREATE OR REPLACE FUNCTION resource_ref_sync() RETURNS TRIGGER AS $$
BEGIN
    CASE TG_TABLE_NAME
    WHEN 'pla_user' THEN
        PERFORM res_update_operate(OLD.avatar, NEW.avatar, 'file_image');
    WHEN 'pla_published' THEN
        PERFORM res_update_operate(OLD.user_avatar_snapshot, NEW.user_avatar_snapshot, 'file_image');
    WHEN 'pla_comment' THEN
        PERFORM res_update_operate(OLD.user_avatar_snapshot, NEW.user_avatar_snapshot,'file_image');
        PERFORM res_update_operate(OLD.additional_image, NEW.additional_image,'file_image');
    -- WHEN 'comment_image' THEN
    --     PERFORM res_update_operate(OLD.uri, NEW.uri,'file_image');
    ELSE
        RAISE '不支持的触发表 %', TG_TABLE_NAME;
    END CASE;
    RETURN NEW;
END; $$ LANGUAGE PLPGSQL;
