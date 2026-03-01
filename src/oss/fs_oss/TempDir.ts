import type { OSSFile } from "../file_object.ts";
import { fsAPI } from "../file_object.ts";
import fs from "node:fs/promises";
import path from "node:path";

export class TempDir {
  #rootDir: string;
  constructor(config: { rootDir: string }) {
    this.#rootDir = path.resolve(config.rootDir);
  }

  /** 将 key 转为完整路径 */
  keyToRelPath(tempKey: string): string {
    if (/^[.\\\/]/.test(tempKey)) throw new Error("无效的 tempDirKey");
    return path.join(this.#rootDir, tempKey);
  }

  async copyInto(from: string, option: GetPathOption = {}): Promise<SaveResult> {
    const key = await this.#ensureDirExist(option);
    await fsAPI.copyFile(from, key.path);
    return key;
  }
  async moveInto(from: string, option: GetPathOption = {}): Promise<SaveResult> {
    const key = await this.#ensureDirExist(option);
    await fsAPI.rename(from, key.path);
    return key;
  }
  open(tempKey: string): Promise<OSSFile> {
    const fileName = this.keyToRelPath(tempKey);
    return fsAPI.open(fileName);
  }
  remove(tempKey: string): Promise<void> {
    const fileName = this.keyToRelPath(tempKey);
    return fsAPI.remove(fileName, { force: true });
  }

  async save(stream: ReadableStream<Uint8Array>, option?: GetPathOption): Promise<SaveResult> {
    const key = await this.#ensureDirExist(option);
    await fs.writeFile(key.path, stream, { flag: "wx" });
    return key;
  }
  async #ensureDirExist(option: GetPathOption = {}): Promise<SaveResult> {
    const res = genNextPath(option);
    const dirPath = path.join(this.#rootDir, res.dir);
    await fsAPI.mkdir(dirPath, { recursive: true });
    return { path: path.join(dirPath, res.baseName), tempKey: res.tempKey };
  }
  async clearOutdated(): Promise<
    {
      useTimeMs: number;
      lv1Skip: { skipCount: number; clearCount: number };
      lv2Skip: { skipCount: number; clearCount: number };
    }
  > {
    const now = Date.now();
    const { lv1Skip, lv2Skip } = await clearTempDir(this.#rootDir);
    return { useTimeMs: Date.now() - now, lv1Skip, lv2Skip };
  }
}

export type SaveResult = {
  tempKey: string;
  path: string;
};

export type GetPathOption = {
  prefix?: string;
  suffix?: string;
  /** 单位为分钟。默认为 60，只能是整数。 只保证子 lifetime 内有效，不保证一定是在 lifetime 结束后立即删除*/
  lifetime?: number;
};

/** 根据当前时间戳生成临时文件目录 */
function genNextTempDir(lifetime: number): string {
  return `${lifetime}/${getLifetimeTz(lifetime)}`;
}

function genNextPath(option: GetPathOption) {
  const { lifetime = 60, suffix, prefix } = option;

  const base = genNextTempDir(lifetime);
  const uid = crypto.randomUUID();
  const dir = prefix ? `${base}/${prefix}` : base;
  const baseName = suffix ? `${uid}_${suffix}` : uid;
  return {
    dir,
    baseName,
    tempKey: `${dir}/${baseName}`,
  };
}
function getLifetimeTz(lifetime: number): number {
  const tz = Date.now() / 1000 / 60; // 时间戳，单位为分钟
  return Math.floor(tz / lifetime);
}

async function clearTempDir(rooDir: string) {
  await fs.access(rooDir);

  const lv1Skip = {
    skipCount: 0,
    clearCount: 0,
  };
  const lv2Skip = {
    skipCount: 0,
    clearCount: 0,
  };
  for await (const dirName of scanDir(rooDir)) {
    const lifetime = parseInt(dirName);
    if (!Number.isSafeInteger(lifetime)) {
      lv1Skip.skipCount++;
      continue;
    }
    const dirPath = path.join(rooDir, dirName);
    const stat = await fsAPI.stat(dirPath);
    if (stat.birthtime) {
      const bt = Math.floor(stat.birthtime.getTime() / 1000 / 60);
      if (bt < lifetime) {
        lv1Skip.skipCount++;
        continue;
      }
    }
    const res = await clearOutdated(dirPath, lifetime);
    lv2Skip.clearCount += res.clearCount;
    lv2Skip.skipCount += res.skipCount;
  }
  return { lv1Skip, lv2Skip };
}
async function clearOutdated(rooDir: string, lifetime: number) {
  let skipCount = 0;
  let clearCount = 0;

  const currentTime = getLifetimeTz(lifetime);
  for await (const dirName of scanDir(rooDir)) {
    const dirTime = parseInt(dirName);
    if (!Number.isSafeInteger(dirTime)) {
      skipCount++;
      continue;
    }
    if (currentTime - dirTime > 1) {
      await fsAPI.remove(path.join(rooDir, dirName), { recursive: true, force: true });
      clearCount++;
    }
  }
  return { skipCount, clearCount };
}

async function* scanDir(dir: string): AsyncGenerator<string> {
  if (typeof Deno === "object") {
    for await (const item of Deno.readDir(dir)) {
      if (item.isDirectory) {
        yield item.name;
      }
    }
  } else {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const dirent of items) {
      if (dirent.isDirectory()) {
        yield dirent.name;
      }
    }
  }
  return;
}
