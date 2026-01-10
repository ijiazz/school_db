export type DbUserProfile = {
  user_id: number;
  live_notice: boolean;
  acquaintance_time: Date | null;
  comment_stat_enabled: boolean;
  /** 发帖数 */
  post_count: number;
  /** 用户点赞的总帖子数 */
  post_like_count: number;
  /** 用户帖子获得的总数量 */
  post_like_get_count: number;
  /** 举报正确数 (客观类，容易判断正确性的，包括帖子、用户) */
  report_correct_count: number;
  /** 举报错误数 (客观类，容易判断正确性的，包括帖子、用户) */
  report_error_count: number;
  /** 举报正确数 (主观类，包括评论) */
  report_subjective_correct_count: number;
  /** 举报错误数 (主观类，包括评论) */
  report_subjective_error_count: number;
};

export type DbUserProfileCreate = Partial<Omit<DbUserProfile, "user_id">> & { user_id: number };
