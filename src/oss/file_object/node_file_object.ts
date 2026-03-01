import fs from "node:fs/promises";
import type { Stats } from "node:fs";
import type { Fs, GetStreamOption, OSSFile, OssObjectInfo } from "./type.ts";

class NodeOSSFile implements OSSFile {
  constructor(private fileHandle: fs.FileHandle) {}

  createReadable(option: GetStreamOption = {}): ReadableStream<Uint8Array> {
    const { preventClose } = option;
    const hd = this.fileHandle;
    const stream = hd.readableWebStream({
      //@ts-ignore
      type: "bytes",
      autoClose: !preventClose,
    }) as ReadableStream<Uint8Array>;
    return stream;
  }
  stat(): Promise<OssObjectInfo> {
    const hd = this.fileHandle;
    return hd.stat().then(nodeStatToOssObjectInfo);
  }
  close(): Promise<void> {
    const hd = this.fileHandle;
    return hd.close();
  }
  [Symbol.asyncDispose]() {
    return this.close();
  }
}
function nodeStatToOssObjectInfo(stat: Stats): OssObjectInfo {
  return {
    atime: stat.atime,
    birthtime: stat.birthtime,
    ctime: stat.ctime,
    isSymlink: stat.isSymbolicLink(),
    mtime: stat.mtime,
    size: stat.size,
  };
}

export const fsAPI: Fs = {
  async open(path: string): Promise<OSSFile> {
    const hd = await fs.open(path);
    return new NodeOSSFile(hd);
  },
  isExist(filename: string): Promise<OssObjectInfo | null> {
    return fs.stat(filename).then(nodeStatToOssObjectInfo).catch((e) => {
      if (e?.code === "ENOENT") return null;
      throw e;
    });
  },
  stat(path: string): Promise<OssObjectInfo> {
    return fs.stat(path).then(nodeStatToOssObjectInfo);
  },
  copyFile: fs.copyFile,
  rename: fs.rename,
  remove: fs.rm,
  realPath: fs.realpath,
  async mkdir(path, option) {
    await fs.mkdir(path, option);
  },
};

// fs.copyFile;
// fs.rename;
// fs.rm;
// fs.realpath;

// fs.mkdir
// fs.link
