export interface DbReview<T extends object = object> {
  id: number;
  create_time: Date;
  resolved_time: Date | null;
  target_type: ReviewTargetType | null;
  info: T | null;
  review_display: ReviewDisplayItem[] | null;
  is_passed: boolean | null;
  is_reviewing: boolean;
  pass_count: number;
  reject_count: number;

  comment: string | null;
  reviewer_id: number | null;
}

export type DbReviewCreate<T extends object = object> = Partial<
  Pick<
    DbReview<T>,
    | "target_type"
    | "info"
    | "review_display"
    | "is_passed"
    | "is_reviewing"
    | "pass_count"
    | "reject_count"
    | "comment"
    | "reviewer_id"
  >
>;
export enum ReviewTargetType {
  post = "post",
  post_comment = "post_comment",
}

export interface DbReviewRecord {
  review_id: number;
  reviewer_id: number;
  review_time: Date;
  is_passed: boolean;
  comment: string | null;
}

export enum ReviewDisplayItemType {
  text = "text",
  media = "media",
}

export type ReviewDisplayItemText = {
  label: string;
  text?: string;
  old_text?: string;
  type: ReviewDisplayItemType.text;
};
export type ReviewDisplayItemMedia = {
  label: string;
  new?: {
    filename: string;
    mediaType: string;
  };
  old?: {
    filename: string;
    mediaType: string;
  };
  type: ReviewDisplayItemType.media;
};

export type ReviewDisplayItem = ReviewDisplayItemText | ReviewDisplayItemMedia;
