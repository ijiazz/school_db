import { TempDir } from "./TempDir.ts";
import { type OSSFile, OssObjectInfo } from "../file_object.ts";

export type ObjectPath = `${string}:${string}` | { bucket: string; objectName: string };
export interface OSS {
  /** 临时目录管理器，用于短期存放上传前的临时文件 */
  readonly tempDir: TempDir;

  /** 确保 bucket 存在，如果不存在则创建 */
  ensureBucket(bucket: string): Promise<void>;

  toObjectPath(bucket: string, objectName: string): string;

  openRead(objectPath: ObjectPath): Promise<OSSFile>;

  remove(objectPath: ObjectPath, option?: RemoveOption): Promise<void>;

  /** oss 内部移动文件 */
  rename(from: ObjectPath, to: ObjectPath): Promise<void>;

  stat(objectPath: ObjectPath): Promise<OssObjectInfo>;

  /** oss 内部复制文件 */
  copy(from: ObjectPath, to: ObjectPath): Promise<void>;

  /** 先保存文件到临时目录，再移动到目标位置，确保文件完整性 */
  saveObject(objectPath: ObjectPath, stream: ReadableStream<Uint8Array>, option?: OverwriteOption): Promise<void>;

  /** 将文件系统的文件复制到 oss */
  copyInto(from: string, to: ObjectPath): Promise<void>;

  /** 将文件系统的文件移动到 oss */
  moveInto(from: string, to: ObjectPath, option?: OverwriteOption): Promise<void>;
}

export type OverwriteOption = {
  overwrite?: boolean;
};
export type RemoveOption = {
  force?: boolean;
};
