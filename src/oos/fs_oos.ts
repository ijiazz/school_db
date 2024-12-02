import fs from "node:fs/promises";
import path from "node:path";
import { Stats } from "node:fs";

export interface FsOosOption {
  onInitError?: (e: Error) => void;
}
export function createFsOOS(rootDir: string, buckets: Iterable<string>, option?: FsOosOption): OOS {
  return new FsOOS(rootDir, buckets, option);
}
class FsOOS implements OOS {
  private bucketSet: Set<string>;
  constructor(
    readonly rootDir: string,
    buckets: Iterable<string>,
    option: FsOosOption = {}
  ) {
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
      }
    );
    if (option.onInitError) this.ready.catch(option.onInitError);
  }
  private ready: undefined | Error | Promise<void>;
  private parsePath(bucket: string, objectName: string) {
    this.checkBucket(bucket);
    this.checkObjectName(objectName);
    return {
      dir: path.resolve(this.rootDir, bucket),
      base: objectName,
    };
  }
  private checkBucket(bucket: string) {
    if (!this.bucketSet.has(bucket)) throw new Error(`Bucket '${bucket} does not exist'`);
  }
  private checkObjectName(objectName: string) {
    if (/\\\//.test(objectName)) throw new Error(`Object name 不能包含 '//' 和 '\\'`);
  }

  private checkStatus() {
    if (this.ready instanceof Promise) return this.ready;
    if (this.ready === undefined) return;
    throw this.ready;
  }
  async fPutObject(bucket: string, objectPath: string, fromPath: string) {
    const { base, dir } = this.parsePath(bucket, objectPath);
    const filename = path.resolve(dir, base);

    await this.checkStatus();

    await fs.mkdir(dir, { recursive: true });
    const exists = await fileExist(filename);
    if (exists) await fs.rm(fromPath).catch(() => {});
    else await fs.rename(fromPath, filename);
  }

  async fPutObjectMany(bucket: string, list: Map<string, string>) {
    this.checkBucket(bucket);
    await this.checkStatus();

    const dir = path.resolve(this.rootDir, bucket);
    await fs.mkdir(dir, { recursive: true });

    const success = new Set<string>();
    const failed = new Map<string, any>();

    const promises: Promise<void>[] = [];
    for (const [objectName, fromPath] of list) {
      this.checkObjectName(objectName);
      const finalPath = path.resolve(dir, objectName);
      const promise = fileExist(finalPath).then(async (exist) => {
        if (exist) return fs.rm(fromPath, { force: true }).catch(() => {});
        await fs.rename(fromPath, finalPath).then(
          () => success.add(objectName),
          (e) => failed.set(objectName, e)
        );
      });
      promises.push(promise);
    }
    await Promise.all(promises);
    return {
      failed,
      successObjectName: success,
    };
  }
  async objectExist(bucket: string, objectName: string) {
    const { dir, base } = this.parsePath(bucket, objectName);
    return fileExist(path.resolve(dir, base));
  }
  async deleteObject(bucket: string, objectName: string): Promise<void> {
    const filename = this.rootDir + "/" + bucket + "/" + objectName;
    await fs.rm(filename, { force: true });
  }
  async deleteObjectMany(bucket: string, list: Set<string>): Promise<Map<string, any>> {
    this.checkBucket(bucket);
    const dir = this.rootDir + "/" + bucket + "/";
    const failed = new Map<string, any>();
    const promises: Promise<any>[] = [];
    for (const objectName of list) {
      const promise = fs.rm(dir + "/" + objectName, { force: true }).catch((e) => failed.set(objectName, e));
      promises.push(promise);
    }
    await Promise.all(promises);
    return failed;
  }
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
export interface OOS {
  fPutObject(bucket: string, objectPath: string, fromPath: string): Promise<void>;
  /**
   * 返回失败的 objectName
   * @param list objectName -> fromPath
   */
  fPutObjectMany(
    bucket: string,
    list: Map<string, string>
  ): Promise<{
    failed: Map<string, any>;
    successObjectName: Set<string>;
  }>;
  objectExist(bucket: string, objectName: string): Promise<Stats | null>;
  /** 删除多个对象，如果删除失败则抛出异常，如果对象不存在，则跳过 */
  deleteObject(bucket: string, objectName: string): Promise<void>;
  /** 删除多个对象，如果对象不存在，则跳过，返回删除失败的对象映射 */
  deleteObjectMany(bucket: string, list: Set<string>): Promise<Map<string, any>>;
}
