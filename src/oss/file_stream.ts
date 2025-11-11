import fs, { FileHandle } from "node:fs/promises";

const defaultChunkSize = 1024 * 32;
class RangeRead {
  constructor(public end?: number) {}
  getChunkSize(offset: number) {
    if (this.end === undefined) {
      return defaultChunkSize;
    }
    const size = this.end - offset;
    if (size >= defaultChunkSize) return defaultChunkSize;
    return size;
  }
}
function getFileStreamNode(path: string, option: CreateFileStreamOption = {}): ReadableStream<Uint8Array> {
  let fd: FileHandle;
  const { start: rangeStart, end: rangeEnd } = option;
  let offset = rangeStart ?? 0;
  const rangeRead = new RangeRead(rangeEnd);

  return new ReadableStream({
    cancel() {
      return fd.close();
    },
    async start() {
      fd = await fs.open(path, "r");
    },
    async pull(ctrl) {
      const readSize = rangeRead.getChunkSize(offset);
      const chunk = new Uint8Array(readSize);
      const { bytesRead } = await fd.read(chunk, { position: offset });
      if (bytesRead === 0) {
        ctrl.close();
        return fd.close();
      } else if (bytesRead < readSize) {
        ctrl.enqueue(chunk.subarray(0, bytesRead));
        ctrl.close();
        return fd.close();
      }
      offset += bytesRead;
      ctrl.enqueue(chunk);
    },
  });
}
function getFileStreamDeno(path: string, option: CreateFileStreamOption = {}): ReadableStream<Uint8Array> {
  const { start: rangeStart, end: rangeEnd } = option;
  let offset = rangeStart ?? 0;
  const rangeRead = new RangeRead(rangeEnd);
  //@ts-ignore
  let fd: Deno.FsFile;
  return new ReadableStream({
    cancel() {
      return fd.close();
    },
    async start() {
      //@ts-ignore
      fd = await Deno.open(path);
      if (rangeStart) {
        //@ts-ignore
        await fd.seek(rangeStart, Deno.SeekMode.Start);
      }
    },
    async pull(ctrl) {
      const readSize = rangeRead.getChunkSize(offset);
      const chunk = new Uint8Array(readSize);
      const bytesRead = await fd.read(chunk);
      if (bytesRead === null || bytesRead === 0) {
        ctrl.close();
        return fd.close();
      } else if (bytesRead < defaultChunkSize) {
        ctrl.enqueue(chunk.subarray(0, bytesRead));
        ctrl.close();
        return fd.close();
      }
      offset += bytesRead;
      ctrl.enqueue(chunk);
    },
  });
}
export type CreateFileStreamOption = {
  start?: number;
  end?: number;
};
export const createFileStream: (filePath: string, option?: CreateFileStreamOption) => ReadableStream<Uint8Array> =
  typeof globalThis.Deno === "object" ? getFileStreamDeno : getFileStreamNode;

async function openFileStreamNode(filePath: string) {
  const hd = await fs.open(filePath);
  //@ts-ignore 这里 deno 还不支持
  const stream = hd.readableWebStream({ type: "bytes" }) as ReadableStream<Uint8Array>;
  return stream.pipeThrough(
    new TransformStream({
      flush() {
        return hd.close();
      },
    }),
  );
}
async function openFileStreamDeno(filePath: string) {
  const fd = await Deno.open(filePath);
  return fd.readable;
}

export const openFileStream: (filePath: string) => Promise<ReadableStream<Uint8Array>> =
  typeof globalThis.Deno === "object" ? openFileStreamDeno : openFileStreamNode;
