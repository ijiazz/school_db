FROM postgres:17-alpine

ADD ./sql ./sql
RUN chmod u+x ./sql/create-merge.sh
RUN ./sql/create-merge.sh /docker-entrypoint-initdb.d/init.sql
