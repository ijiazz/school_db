export interface OSSFile extends AsyncDisposable {
  close(): Promise<void>;
  createReadable(option?: GetStreamOption): ReadableStream<Uint8Array>;
  stat(): Promise<OssObjectInfo>;
}

export interface GetStreamOption {
  preventClose?: boolean;
}
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

export type FilePath = string | URL;

export type Fs = {
  open(path: FilePath): Promise<OSSFile>;
  isExist(path: FilePath): Promise<OssObjectInfo | null>;
  stat(path: FilePath): Promise<OssObjectInfo>;
  copyFile(from: FilePath, to: FilePath): Promise<void>;
  rename(from: FilePath, to: FilePath): Promise<void>;
  remove(path: FilePath, option?: RemoveOption): Promise<void>;
  realPath(path: FilePath): Promise<string>;
  mkdir(path: FilePath, option?: MkdirOption): Promise<void>;
};
export type MkdirOption = {
  recursive?: boolean;
};

export type RemoveOption = {
  recursive?: boolean;
  force?: boolean;
};
