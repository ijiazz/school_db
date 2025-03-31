import fs from "node:fs/promises";
import path from "node:path";
import type { Stats } from "node:fs";
import { createFileStream, openFileStream } from "./file_stream.ts";

export interface FsOssOption {
  onInitError?: (e: Error) => void;
}
export function createFsOSS(rootDir: string, buckets: Iterable<string>, option?: FsOssOption): OSS {
  return new FsOSS(rootDir, buckets, option);
}

class FsOSS implements OSS {
  private bucketSet: Set<string>;
  readonly rootDir: string;
  constructor(rootDir: string, buckets: Iterable<string>, option: FsOssOption = {}) {
    rootDir = path.resolve(rootDir);
    this.rootDir = rootDir;
    const bucketSet = new Set<string>();
    for (const bucket of buckets) {
      if (path.isAbsolute(bucket)) throw new Error("bucket 不能是绝对路径");
      bucketSet.add(bucket);
      //TODO bucket 名称不能包含子集 例如 不能同时存在 abc/k  abc/k/uu
    }
    this.bucketSet = bucketSet;
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

  private checkStatus() {
    if (this.ready instanceof Promise) return this.ready;
    if (this.ready === undefined) return;
    throw this.ready;
  }
  private checkBucket(bucket: string) {
    if (!this.bucketSet.has(bucket)) throw new Error(`Bucket '${bucket} does not exist'`);
  }
  getBucket(bucket: string) {
    return new FsOSS.FsBucket(this, bucket);
  }

  private static FsBucket = class FsOssBucket implements OssBucket {
    constructor(
      private oss: FsOSS,
      readonly bucketName: string,
    ) {
      oss.checkBucket(bucketName);
      this.baseDir = path.join(oss.rootDir, bucketName);
    }
    private readonly baseDir: string;
    private checkObjectName(objectName: string) {
      if (/\\\//.test(objectName)) throw new Error(`Object name 不能包含 '//' 和 '\\'`);
      return path.join(this.baseDir, objectName);
    }

    saveObject(
      objectPath: string,
      stream: ReadableStream<Uint8Array>,
      option: { overwrite?: boolean } = {},
    ): Promise<void> {
      const filename = this.checkObjectName(objectPath);
      return fs.writeFile(filename, stream, { flag: option.overwrite ? "w+" : "wx" });
    }

    async fMoveInto(objectPath: string, fromPath: string) {
      const filename = this.checkObjectName(objectPath);

      await this.oss.checkStatus();

      const exists = await fileExist(filename);
      if (exists) await fs.rm(fromPath).catch(() => {});
      else await fs.rename(fromPath, filename);
    }

    async fMoveIntoMany(list: Map<string, string>) {
      await this.oss.checkStatus();
      const success = new Set<string>();
      const exists = new Set<string>();
      const failed = new Map<string, any>();

      const promises: Promise<void>[] = [];
      for (const [objectName, fromPath] of list) {
        this.checkObjectName(objectName);
        const finalPath = this.checkObjectName(objectName);
        const promise = fileExist(finalPath).then((exist): Promise<any> => {
          if (exist) {
            exists.add(objectName);
            return fs.rm(fromPath, { force: true }).catch(() => {});
          }
          return fs.rename(fromPath, finalPath).then(
            () => success.add(objectName),
            (e) => failed.set(objectName, e),
          );
        });
        promises.push(promise);
      }
      await Promise.all(promises);
      return {
        failed,
        exists,
        success: success.union(exists),
      };
    }

    objectExist(objectName: string) {
      const filename = this.checkObjectName(objectName);
      return fileExist(filename);
    }
    async deleteObject(objectName: string): Promise<void> {
      const filename = this.baseDir + "/" + objectName;
      await fs.rm(filename, { force: true });
    }
    async deleteObjectMany(list: Set<string>): Promise<Map<string, any>> {
      const dir = this.baseDir + "/";
      const failed = new Map<string, any>();
      const promises: Promise<any>[] = [];
      for (const objectName of list) {
        const promise = fs.rm(dir + objectName, { force: true }).catch((e) => failed.set(objectName, e));
        promises.push(promise);
      }
      await Promise.all(promises);
      return failed;
    }
    async stat(objectName: string): Promise<OssObjectInfo> {
      const filename = this.checkObjectName(objectName);
      const stat = await fs.stat(filename, {});
      return toOssStat(stat);
    }
    getObjectStream(objectName: string): Promise<ReadableStream<Uint8Array>> {
      return openFileStream(this.checkObjectName(objectName));
    }
    /** 创建对象流，需要注意，这不会检测文件是否存在 */
    createObjectStream(objectName: string): ReadableStream<Uint8Array> {
      return createFileStream(this.checkObjectName(objectName));
    }
  };
}
function toOssStat(stat: Stats) {
  return {
    atime: stat.atime,
    birthtime: stat.birthtime,
    ctime: stat.ctime,
    isSymlink: stat.isSymbolicLink(),
    mtime: stat.mtime,
    size: stat.size,
  };
}

async function checkDir(rootDir: string, subDir?: Iterable<string>) {
  let checkList: Promise<any>[] = [];
  if (subDir) {
    for (const bucket of subDir) {
      const dirname = path.resolve(rootDir, bucket);
      checkList.push(fs.mkdir(dirname, { recursive: true }));
    }
    await Promise.all(checkList);
  }
}
function fileExist(filename: string) {
  return fs.stat(filename).catch((e) => {
    if (e?.code === "ENOENT") return null;
    throw e;
  });
}

/** @public */
export interface OSS {
  getBucket(bucketName: string): OssBucket;
}

export interface OssBucket {
  readonly bucketName: string;
  saveObject(objectPath: string, stream: ReadableStream<Uint8Array>): Promise<void>;
  fMoveInto(objectPath: string, formPath: string): Promise<void>;
  /**
   * 返回失败的 objectName
   * @param list objectName -> fromPath
   */
  fMoveIntoMany(list: Map<string, string>): Promise<OssManyOperateResult>;
  // fCopyInto(objectPath: string, formPath: string): Promise<void>;
  // fCopyIntoMany(objectPath: string, list: Map<string, string>): Promise<OssManyOperateResult>;
  objectExist(objectName: string): Promise<Stats | null>;
  /** 删除多个对象，如果删除失败则抛出异常，如果对象不存在，则跳过 */
  deleteObject(objectName: string): Promise<void>;
  /** 删除多个对象，如果对象不存在，则跳过，返回删除失败的对象映射 */
  deleteObjectMany(list: Set<string>): Promise<Map<string, any>>;

  getObjectStream(objectName: string): Promise<ReadableStream<Uint8Array>>;
  /** 创建对象流，需要注意，这不会检测文件是否存在 */
  createObjectStream(objectName: string): ReadableStream<Uint8Array>;
  stat(objectName: string): Promise<OssObjectInfo>;
}

export type OssManyOperateResult = {
  failed: Map<string, any>;
  success: Set<string>;
};

export interface OssObjectInfo {
  /** True if this is info for a symlink. Mutually exclusive to
   * `FileInfo.isFile` and `FileInfo.isDirectory`. */
  isSymlink: boolean;
  /** The size of the file, in bytes. */
  size: number;
  /** The last modification time of the file. This corresponds to the `mtime`
   * field from `stat` on Linux/Mac OS and `ftLastWriteTime` on Windows. This
   * may not be available on all platforms. */
  mtime: Date | null;
  /** The last access time of the file. This corresponds to the `atime`
   * field from `stat` on Unix and `ftLastAccessTime` on Windows. This may not
   * be available on all platforms. */
  atime: Date | null;
  /** The creation time of the file. This corresponds to the `birthtime`
   * field from `stat` on Mac/BSD and `ftCreationTime` on Windows. This may
   * not be available on all platforms. */
  birthtime: Date | null;
  /** The last change time of the file. This corresponds to the `ctime`
   * field from `stat` on Mac/BSD and `ChangeTime` on Windows. This may
   * not be available on all platforms. */
  ctime: Date | null;
}
