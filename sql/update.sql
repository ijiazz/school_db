--  ALTER TABLE pla_user ADD COLUMN follower_count INT, ADD COLUMN following_count INT;

--  UPDATE pla_user SET follower_count = (extra->'follower_count')::INT, following_count=(extra ->'following_count')::INT;
--  UPDATE pla_user  SET extra =extra-('{follower_count,following_count}'::TEXT[]);

alter table pla_comment alter pla_uid drop not null;
ALTER TABLE public.pla_comment DROP CONSTRAINT pla_comment_platform_pla_uid_fkey;
ALTER TABLE public.pla_comment ADD CONSTRAINT pla_comment_platform_pla_uid_fkey FOREIGN KEY (platform,pla_uid) REFERENCES public.pla_user(platform,pla_uid) ON DELETE SET NULL ON UPDATE CASCADE;
