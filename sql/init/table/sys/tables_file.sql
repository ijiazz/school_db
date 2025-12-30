SET client_encoding = 'UTF8';

CREATE TYPE media_level AS ENUM('origin','thumb');
CREATE TYPE media_type AS ENUM('video','audio','image'); -- 资源类型


CREATE TABLE sys.file (
    bucket VARCHAR NOT NULL, -- 存储桶
    filename VARCHAR NOT NULL, -- 文件路径
    size INT NOT NULL,   --文件大小
    create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hash VARCHAR NOT NULL,
    ref_count INT NOT NULL DEFAULT 0,
    media_type media_type NULL,
    meta JSONB NOT NULL, -- 资源元数据
    PRIMARY KEY (bucket, filename),
    CONSTRAINT args CHECK(meta IS NULL OR jsonb_typeof(meta)='object'),
    CONSTRAINT path_no_sp CHECK(position('/' in filename) = 0)
);
CREATE INDEX idx_sys_file_ref_count ON sys.file(ref_count);
CREATE INDEX idx_sys_file_meta ON sys.file USING GIN (meta);

 
-- from == to: create  to == null: delete , from !=to: move
CREATE TABLE sys.file_operation(
    bucket VARCHAR NOT NULL, -- 存储桶
    filename VARCHAR NOT NULL, -- 文件路径
    to_bucket VARCHAR, -- 目标存储桶（仅在移动操作中使用）
    to_path VARCHAR, -- 目标文件路径（仅在移动操作中使用）
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (bucket, filename),
    CONSTRAINT path_no_sp CHECK(position('/' in filename) = 0)
);

/* 

create: 
1. 上传文件到临时目录
2. 记录操作到 sys.file_operation
3. 把文件从临时目录移动到目标目录，
4. 更新 sys.file 并删除 sys.file_operation 记录
 
update: 

1. 记录操作到 sys.file_operation
3. 把文件从原路径移动到到目标目录
4. 更新 sys.file 并删除 sys.file_operation 记录

delete:
1. 记录操作到 sys.file_operation
2. 删除文件
3. 更新 sys.file 并删除 sys.file_operation 记录


 */