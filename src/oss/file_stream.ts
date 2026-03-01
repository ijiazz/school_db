import fs, { type FileHandle } from "node:fs/promises";

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
  let fd: FileHandle | Promise<FileHandle>;
  const { start: rangeStart, end: rangeEnd } = option;
  let offset = rangeStart ?? 0;
  const rangeRead = new RangeRead(rangeEnd);

  return new ReadableStream({
    async cancel() {
      const fhd = await fd;
      return fhd.close();
    },
    async start() {
      fd = fs.open(path, "r");
      fd = await fd;
    },
    async pull(ctrl) {
      const fhd = fd as FileHandle;
      const readSize = rangeRead.getChunkSize(offset);
      const chunk = new Uint8Array(readSize);
      const { bytesRead } = await fhd.read(chunk, { position: offset });
      if (bytesRead === 0) {
        ctrl.close();
        return fhd.close();
      } else if (bytesRead < readSize) {
        ctrl.enqueue(chunk.subarray(0, bytesRead));
        ctrl.close();
        return fhd.close();
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
  let fd: Deno.FsFile | Promise<Deno.FsFile>;
  return new ReadableStream({
    async cancel() {
      const fhd = await fd;
      return fhd.close();
    },
    async start() {
      fd = Deno.open(path);
      fd = await fd;
      if (rangeStart) {
        await fd.seek(rangeStart, Deno.SeekMode.Start);
      }
    },
    async pull(ctrl) {
      const fhd = fd as Deno.FsFile;
      const readSize = rangeRead.getChunkSize(offset);
      const chunk = new Uint8Array(readSize);
      const bytesRead = await fhd.read(chunk);
      if (bytesRead === null || bytesRead === 0) {
        ctrl.close();
        return fhd.close();
      } else if (bytesRead < defaultChunkSize) {
        ctrl.enqueue(chunk.subarray(0, bytesRead));
        ctrl.close();
        return fhd.close();
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
