
CREATE TYPE media_type AS ENUM('video','audio','image'); 

 
CREATE OR REPLACE FUNCTION get_platform_flag_index(platform platform_flag)
RETURNS INT AS $$
DECLARE
    index INT;
BEGIN
    SELECT INTO index array_position(enum_range(NULL::platform_flag), platform);
    RETURN index;
END; $$ LANGUAGE plpgsql;

CREATE TABLE pla_asset_media_missing(
    platform platform_flag,
    asset_id VARCHAR,
    index INT NOT NULL,
    type media_type NOT NULL, -- 资源类
    description VARCHAR, -- 描述
    
    FOREIGN KEY (platform, asset_id) REFERENCES pla_asset (platform, asset_id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (platform, asset_id, index)
);

-- file_path `pla_post_media/${file_id}.${ext}`
CREATE TABLE pla_asset_media(
    file_id VARCHAR PRIMARY KEY,
    ext VARCHAR(10) NOT NULL, -- 文件扩展名   

    platform platform_flag,
    asset_id VARCHAR,
    index INT NOT NULL, -- 作品在列表中的索引
    level media_level NOT NULL, -- 媒体质量等级

    size INT NOT NULL, --文件大

    type media_type NOT NULL, -- 资源类型
    meta JSONB NOT NULL, -- 资源元数据
    hash VARCHAR NOT NULL, -- 16进制hash值
    hash_type VARCHAR NOT NULL, -- hash算法类型 
    uri VARCHAR NOT NULL, -- 资源uri

    FOREIGN KEY (platform, asset_id) REFERENCES pla_asset (platform, asset_id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT pla_asset_media_index UNIQUE (platform, asset_id,index,level)
);
CREATE INDEX idxfk_pla_asset_media_asset_id ON pla_asset_media(platform, asset_id,index);
CREATE INDEX idx_pla_asset_media_media_type ON pla_asset_media(type);
CREATE INDEX idx_pla_asset_media_meta ON pla_asset_media USING gin(meta);


GRANT SELECT,INSERT,UPDATE ON pla_asset_media_missing TO ijia_crawler;
GRANT SELECT,INSERT,UPDATE ON pla_asset_media TO ijia_crawler;
GRANT SELECT ON pla_asset_media TO ijia_web;


INSERT INTO pla_asset_media (file_id, ext, platform, asset_id, index, size, level, type, meta, hash, hash_type,uri)
SElECT 
get_platform_flag_index(platform)||'-'||asset_id||'-'||index||'-'||level AS file_id,
substring(uri FROM '(?!\.)[^\.]+$') as ext, 
platform,asset_id,index,size,level,
'image'::media_type  AS type,
jsonb_build_object('width',width,'height',height) AS meta,
substring(uri FROM '(?!_)[0-9a-f]+(?=\.\w+)') AS hash, 
substring(uri FROM '(?!'||asset_id||')\w+(?=_)') AS hash_type,
uri
FROM asset_image
UNION ALL

SElECT 
get_platform_flag_index(platform)||'-'||asset_id||'-'||index||'-'||level AS file_id,
substring(uri FROM '(?!\.)[^\.]+$') as ext, 
platform,asset_id,index,size,level,
'video'::media_type  AS type,
jsonb_build_object('width',width,'height',height,'format',format,'frame_num',frame_num,'fps',fps,'bit_rate',bit_rate) AS meta,
substring(uri FROM '(?!_)[0-9a-f]+(?=\.\w+)') AS hash, 
substring(uri FROM '(?!'||asset_id||')\w+(?=_)') AS hash_type,
uri 
FROM asset_video;

INSERT INTO pla_asset_media_missing (platform, asset_id, index, type)
SELECT platform, asset_id, index, type FROM pla_asset_media
WHERE uri LIKE 'SP_%';


DROP FUNCTION get_platform_flag_index(platform_flag);

-- 需要移动所有文件。OSS_BUCKETS 有变更。

ALTER TABLE pla_asset_media DROP COLUMN uri; -- 移动所有文件后删除这个列

-- 删除原始表
DROP TABLE asset_image;
DROP TABLE asset_video;
DROP TABLE asset_audio;