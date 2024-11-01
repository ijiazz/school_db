--  ALTER TABLE pla_user ADD COLUMN follower_count INT, ADD COLUMN following_count INT;

--  UPDATE pla_user SET follower_count = (extra->'follower_count')::INT, following_count=(extra ->'following_count')::INT;
--  UPDATE pla_user  SET extra =extra-('{follower_count,following_count}'::TEXT[]);
