export type DbLog = {
  name: string;
  level: LogLevel;
  info: Object;
  create_time: Date;
};
export type DbLogCreate = {
  name: string;
  level: LogLevel;
  info: Object;
  create_time?: Date | undefined;
};
export enum LogLevel {
  log = "log",
  info = "info",
  warn = "warn",
  error = "error",
}
