import fs from "node:fs/promises";
import path from "node:path";
import { createFileStream } from "../file_stream.ts";
import { fsAPI, type OssObjectInfo } from "../file_object.ts";
import type { Stats } from "node:fs";
import type { OSS } from "./FsOSS.ts";

export class OssBucket {
  constructor(
    private oss: OSS,
    readonly bucketName: string,
    private readonly baseDir: string,
  ) {
  }
  private checkObjectName(objectName: string) {
    if (/\\\//.test(objectName)) throw new Error(`Object name 不能包含 '//' 和 '\\'`);
    return path.join(this.baseDir, objectName);
  }
  toObjectPath(objectName: string) {
    const oss = this.oss;
    return oss.toObjectPath(this.bucketName, objectName);
  }

  /** 先保存文件到临时目录，再移动到目标位置，确保文件完整性 */
  async saveObject(
    objectPath: string,
    stream: ReadableStream<Uint8Array>,
    option: { overwrite?: boolean } = {},
  ): Promise<void> {
    const tempDir = this.oss.tempDir;
    const filename = this.checkObjectName(objectPath);

    await this.oss.checkStatus();

    let filePath: string;
    try {
      const { tempKey } = await tempDir.save(stream);
      filePath = tempDir.keyToRelPath(tempKey);
    } catch (error) {
      await fsAPI.remove(filename, { force: true }).catch(() => {});
      throw error;
    }
    if (option.overwrite) {
      await fsAPI.remove(filename, { force: true });
    }
    await fsAPI.rename(filePath, filename);
  }

  async fMoveInto(objectPath: string, fromPath: string) {
    const filename = this.checkObjectName(objectPath);

    await this.oss.checkStatus();

    const exists = await fileExist(filename);
    if (exists) await fsAPI.remove(fromPath, { force: true });
    else await fsAPI.rename(fromPath, filename);
  }
  /**
   * 返回失败的 objectName
   * @param list objectName -> fromPath
   */
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
          return fsAPI.remove(fromPath, { force: true }).catch(() => {});
        }
        return fsAPI.rename(fromPath, finalPath).then(
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

  objectExist(objectName: string): Promise<Stats | null> {
    const filename = this.checkObjectName(objectName);
    return fileExist(filename);
  }
  /** 删除多个对象，如果删除失败则抛出异常，如果对象不存在，则跳过 */
  async deleteObject(objectName: string): Promise<void> {
    const filename = this.baseDir + "/" + objectName;
    await fsAPI.remove(filename, { force: true });
  }
  /** 删除多个对象，如果对象不存在，则跳过，返回删除失败的对象映射 */
  async deleteObjectMany(list: Set<string>): Promise<Map<string, any>> {
    const dir = this.baseDir + "/";
    const failed = new Map<string, any>();
    const promises: Promise<any>[] = [];
    for (const objectName of list) {
      const promise = fsAPI.remove(dir + objectName, { force: true }).catch((e) => failed.set(objectName, e));
      promises.push(promise);
    }
    await Promise.all(promises);
    return failed;
  }
  stat(objectName: string): Promise<OssObjectInfo> {
    const filename = this.checkObjectName(objectName);
    return fsAPI.stat(filename);
  }
  async openObjectStream(objectName: string): Promise<ReadableStream<Uint8Array>> {
    const fd = await fsAPI.open(this.checkObjectName(objectName));
    return fd.createReadable();
  }
  /** @deprecated 改用 openObjectStream */
  getObjectStream(objectName: string): Promise<ReadableStream<Uint8Array>> {
    return this.openObjectStream(objectName);
  }
  /** 创建对象流，需要注意，这不会检测文件是否存在 */
  createObjectStream(objectName: string): ReadableStream<Uint8Array> {
    return createFileStream(this.checkObjectName(objectName));
  }
}
function fileExist(filename: string): Promise<Stats | null> {
  return fs.stat(filename).catch((e) => {
    if (e?.code === "ENOENT") return null;
    throw e;
  });
}
