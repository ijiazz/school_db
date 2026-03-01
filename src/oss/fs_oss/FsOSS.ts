import path from "node:path";
import { fsAPI, type OSSFile } from "../file_object.ts";
import { TempDir } from "./TempDir.ts";
import { OssBucket } from "./OssBucket.ts";

export interface FsOssOption {
  onInitError?: (e: Error) => void;
}
export type ObjectPath = `${string}:${string}`;

export type OssManyOperateResult = {
  failed: Map<string, any>;
  success: Set<string>;
};

class FsOSS {
  private bucketSet: Set<string>;
  private rootDir: string;
  readonly tempDir: TempDir;
  constructor(rootDir: string, buckets: Iterable<string>, option: FsOssOption = {}) {
    rootDir = path.resolve(rootDir);
    this.rootDir = rootDir;
    const bucketSet = new Set<string>();
    const tempDir = "_temp";
    bucketSet.add(tempDir);

    for (const bucket of buckets) {
      if (path.isAbsolute(bucket)) throw new Error("bucket 不能是绝对路径");
      if (bucket === tempDir) throw new Error(`bucket 不能命名为 '${tempDir}'`);
      bucketSet.add(bucket);
      //TODO bucket 名称不能包含子集 例如 不能同时存在 abc/k  abc/k/uu
    }
    this.bucketSet = bucketSet;
    this.tempDir = new TempDir({ rootDir: path.join(rootDir, tempDir) });

    this.ready = checkDir(rootDir, bucketSet).then(
      () => {
        this.ready = undefined;
      },
      (e) => {
        if (e instanceof Error) e = new Error("error", { cause: e });
        this.ready = e;
        throw e;
      },
    );
    if (option.onInitError) this.ready.catch(option.onInitError);
  }
  private ready: undefined | Error | Promise<void>;

  checkStatus(): Promise<void> | undefined {
    if (this.ready instanceof Promise) return this.ready;
    if (this.ready === undefined) return;
    throw this.ready;
  }
  private checkBucket(bucket: string) {
    if (!this.bucketSet.has(bucket)) throw new Error(`Bucket '${bucket} does not exist'`);
  }
  getBucket(bucket: string) {
    this.checkBucket(bucket);
    return new OssBucket(this, bucket, path.join(this.rootDir, bucket));
  }

  private toFilePath(objectPath: ObjectPath): string {
    return toReadPath(this.rootDir, objectPath);
  }
  toObjectPath(bucket: string, objectName: string): string {
    return getObjectPath(bucket, objectName);
  }

  open(objectPath: ObjectPath): Promise<OSSFile> {
    return fsAPI.open(this.toFilePath(objectPath));
  }
  remove(objectPath: ObjectPath): Promise<void> {
    return fsAPI.remove(this.toFilePath(objectPath), { force: true });
  }
  /** oss 内部移动文件 */
  rename(from: ObjectPath, to: ObjectPath): Promise<void> {
    const fromFilename = this.toFilePath(from);
    const toFilename = this.toFilePath(to);
    return fsAPI.rename(fromFilename, toFilename);
  }

  /** oss 内部复制文件 */
  copy(from: ObjectPath, to: ObjectPath): Promise<void> {
    const fromFilename = this.toFilePath(from);
    return this.copyInto(fromFilename, to);
  }

  /** 将文件系统的文件复制到 oss */
  async copyInto(from: string, to: ObjectPath): Promise<void> {
    const { path } = await this.tempDir.copyInto(from);
    return fsAPI.rename(path, this.toFilePath(to));
  }
  /** 将文件系统的文件移动到 oss */
  moveInto(from: string, to: ObjectPath): Promise<void> {
    return fsAPI.rename(from, this.toFilePath(to));
  }
}
export { FsOSS as OSS };

const ObjectPathReg = /([^\.:\\\/].*):([^:\\\/]+)/;
function toReadPath(baseDir: string, objectPath: ObjectPath) {
  if (!ObjectPathReg.test(objectPath)) throw new Error(`无效的 ObjectPath`);
  return path.join(baseDir, objectPath.replace(":", "/"));
}
function getObjectPath(bucket: string, objectName: string) {
  return `${bucket}:${objectName}`;
}

async function checkDir(rootDir: string, subDir?: Iterable<string>) {
  const checkList: Promise<any>[] = [];
  if (subDir) {
    for (const bucket of subDir) {
      const dirname = path.resolve(rootDir, bucket);
      checkList.push(fsAPI.mkdir(dirname, { recursive: true }));
    }
    await Promise.all(checkList);
  }
}
