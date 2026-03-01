import type { FilePath, Fs, GetStreamOption, OSSFile, OssObjectInfo } from "./type.ts";

class DenoOSSFile implements OSSFile {
  constructor(private fileHandle: Deno.FsFile) {}

  createReadable(option: DenoGetStreamOption = {}): ReadableStream<Uint8Array> {
    const { preventClose = false, chunkSize = 1024 * 64, oldBuffer } = option;
    if (!preventClose) return this.fileHandle.readable;
    const hd = this.fileHandle;

    let buffer: Uint8Array | null = null;
    return new ReadableStream<Uint8Array>({
      start() {
        if (oldBuffer) {
          buffer = new Uint8Array(chunkSize);
        }
      },
      async pull(controller) {
        const chunk = oldBuffer ? buffer! : new Uint8Array(chunkSize);
        const readLen = await hd.read(chunk);
        if (readLen === null) {
          controller.close();
        } else if (readLen) {
          if (readLen === chunk.length) {
            controller.enqueue(chunk);
          } else {
            controller.enqueue(chunk.subarray(0, readLen));
          }
        }
      },
    });
  }
  stat(): Promise<OssObjectInfo> {
    const hd = this.fileHandle;
    return hd.stat();
  }
  async close(): Promise<void> {
    const hd = this.fileHandle;
    return hd.close();
  }
  [Symbol.asyncDispose]() {
    return this.close();
  }
  [Symbol.dispose]() {
    return this.close();
  }
}

export type DenoGetStreamOption = GetStreamOption & {
  chunkSize?: number;
  oldBuffer?: boolean;
};
//TODO: deno 实现
export const fsAPI: Partial<Fs> = {
  async open(path: FilePath): Promise<OSSFile> {
    const hd = await Deno.open(path);
    return new DenoOSSFile(hd);
  },
  stat: Deno.stat,
  // copyFile: Deno.copyFile,
  // rename: Deno.rename,
  // realPath: Deno.realPath,
  // mkdir: Deno.mkdir,
};
// Deno.copyFile;
// Deno.rename;
// Deno.remove;
// Deno.realPath;

// Deno.mkdir;
// Deno.link;
