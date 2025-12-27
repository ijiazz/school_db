export type DbCaptchaPicture = {
  id: string;
  type: string | null;
  is_true: boolean | null;
  yes_count: number;
  no_count: number;
};
export type DbCaptchaPictureCreate = {
  id: string;
  type?: string | null | undefined;
  is_true?: boolean | null | undefined;
  yes_count?: number | undefined;
  no_count?: number | undefined;
};
