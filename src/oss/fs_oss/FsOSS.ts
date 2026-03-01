import path from "node:path";
import { fsAPI, type OSSFile, OssObjectInfo } from "../file_object.ts";
import { TempDir } from "./TempDir.ts";
import type { ObjectPath, OSS, RemoveOption } from "./OSS.ts";
import { createFileStream, CreateFileStreamOption } from "../file_stream.ts";

export interface FsOssOption {
  onInitError?: (e: Error) => void;
}

export function createFsOSS(rootDir: string, buckets: Iterable<string>, option?: FsOssOption): FsOSS {
  return new FsOSS(rootDir, buckets, option);
}
class FsOSS implements OSS {
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

  private checkStatus(): Promise<void> | undefined {
    if (this.ready instanceof Promise) return this.ready;
    if (this.ready === undefined) return;
    throw this.ready;
  }
  private checkBucket(bucket: string) {
    if (!this.bucketSet.has(bucket)) throw new Error(`Bucket '${bucket} does not exist'`);
  }

  /** 确保 bucket 存在，如果不存在则创建 */
  async ensureBucket(bucket: string): Promise<void> {
    this.checkBucket(bucket);
    const dirName = path.join(this.rootDir, bucket);
    await fsAPI.mkdir(dirName, { recursive: true });
  }

  private toFilePath(objectPath: ObjectPath): string {
    const { rootDir } = this;
    let bucket: string, objectName: string;
    if (typeof objectPath === "string") {
      const res = objectPath.split(":");
      bucket = res[0];
      objectName = res[1];
    } else {
      bucket = objectPath.bucket;
      objectName = objectPath.objectName;
    }
    this.checkBucket(bucket);
    if (!objectName) throw new Error(`objectName 不能为空`);

    const filePath = path.join(rootDir, bucket, objectName);
    if (!filePath.startsWith(rootDir)) {
      throw new Error(`无效的 objectPath：${JSON.stringify(objectPath)}`);
    }
    return filePath;
  }
  toObjectPath(bucket: string, objectName: string): string {
    return `${bucket}:${objectName}`;
  }

  openRead(objectPath: ObjectPath): Promise<OSSFile> {
    return fsAPI.open(this.toFilePath(objectPath));
  }
  remove(objectPath: ObjectPath, option: RemoveOption = {}): Promise<void> {
    const { force } = option;
    return fsAPI.remove(this.toFilePath(objectPath), { force });
  }
  /** oss 内部移动文件 */
  rename(from: ObjectPath, to: ObjectPath): Promise<void> {
    const fromFilename = this.toFilePath(from);
    const toFilename = this.toFilePath(to);
    return fsAPI.rename(fromFilename, toFilename);
  }
  stat(objectPath: ObjectPath): Promise<OssObjectInfo> {
    const filePath = this.toFilePath(objectPath);
    return fsAPI.stat(filePath);
  }
  /** oss 内部复制文件 */
  copy(from: ObjectPath, to: ObjectPath): Promise<void> {
    const fromFilename = this.toFilePath(from);
    return this.copyInto(fromFilename, to);
  }

  /** 先保存文件到临时目录，再移动到目标位置，确保文件完整性 */
  async saveObject(
    objectPath: ObjectPath,
    stream: ReadableStream<Uint8Array>,
    option: { overwrite?: boolean } = {},
  ): Promise<void> {
    const { overwrite } = option;
    const tempDir = this.tempDir;
    const filename = this.toFilePath(objectPath);

    await this.checkStatus();

    let filePath: string;
    try {
      const { tempKey } = await tempDir.save(stream);
      filePath = tempDir.keyToRelPath(tempKey);
    } catch (error) {
      await fsAPI.remove(filename, { force: true }).catch(() => {});
      throw error;
    }
    if (overwrite) {
      await fsAPI.remove(filename, { force: true });
    }
    await fsAPI.rename(filePath, filename);
  }

  /** 将文件系统的文件复制到 oss */
  async copyInto(from: string, to: ObjectPath): Promise<void> {
    const { path } = await this.tempDir.copyInto(from);
    return fsAPI.rename(path, this.toFilePath(to));
  }
  /** 将文件系统的文件移动到 oss */
  async moveInto(from: string, to: ObjectPath, option: { overwrite?: boolean } = {}): Promise<void> {
    const targetPath = this.toFilePath(to);
    if (option.overwrite) {
      await fsAPI.remove(targetPath, { force: true });
    }
    return fsAPI.rename(from, targetPath);
  }

  /** 创建可读流，这不会检测文件是否存在 */
  toReadable(objectPath: ObjectPath, option?: CreateFileStreamOption): ReadableStream<Uint8Array> {
    return createFileStream(this.toFilePath(objectPath), option);
  }
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
