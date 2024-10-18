SET client_encoding = 'UTF8';
CREATE DATABASE ijia_test;
\c ijia_test;

\i scripts/init/create_tables.sql;
\i scripts/init/create_functions.sql;
\i scripts/init/create_triggers.sql;
\i scripts/init/init_data.sql;
