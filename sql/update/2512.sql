
INSERT INTO sys.file (bucket, path, size, hash, ref_count, meta)
SELECT
    'comment_img' AS bucket,
    c.id AS path,
    c.size AS size,
    c.hash AS hash,
    c.ref_count AS ref_count,
    jsonb_build_object('image_width', c.image_width,'image_height', c.image_height) AS meta
FROM comment_image AS c


INSERT INTO pla.post_comment_media (platform, comment_id, index, level, file_id, type)
SELECT 
  platform,id,0 AS index, 'origin' AS level,
  'comment_img'||additional_image, 'image' AS type
FROM pla_comment WHERE additional_image IS NOT NULL;
UNIQUE ALL 
SELECT 
  platform,id,0 AS index, 'thumb' AS level,
  'comment_img'||additional_image_thumb, 'image' AS type
FROM pla_comment WHERE additional_image_thumb IS NOT NULL;


DROP TABLE comment_image;
DROP TRIGGER sync_pla_comment_resource_ref_count ON pla_comment;
DROP FUNCTION pla_comment_resource_ref_sync();

ALTER TABLE pla_comment
    DROP COLUMN additional_image,
    DROP COLUMN additional_image_thumb;