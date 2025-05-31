

ALTER TABLE public.user DROP COLUMN status;
CREATE INDEX idxfk_avatar ON public.user(avatar);

CREATE TABLE user_blacklist( -- 用户黑名单
    user_id INT PRIMARY KEY REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason VARCHAR(100) NOT NULL -- 进黑名单原因
);
