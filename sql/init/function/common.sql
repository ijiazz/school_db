SET client_encoding = 'UTF8';

 -- 一些公共函数

/**
 * @param input_array 输入的索引数组
 * @param map 映射数组
 * @return 映射后的值数组
 */
CREATE OR REPLACE FUNCTION array_map_index(input_array SMALLINT[], map SMALLINT[])
  RETURNS SMALLINT[] AS $$
  DECLARE 
  BEGIN 
    IF map IS NULL THEN
      RETURN input_array;
    END IF;
    RETURN (SELECT ARRAY_AGG(map[t.index + 1]) FROM unnest(input_array) AS t(index));
  END; $$ LANGUAGE PLPGSQL;
