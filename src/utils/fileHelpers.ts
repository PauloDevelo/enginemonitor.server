import fs from 'fs';
import getSize from 'get-folder-size';

const getFolderSize = (myFolder: string): Promise<number> => new Promise((resolve, reject) => {
  getSize(myFolder, (err: any, size: number) => {
    if (err) {
      reject(err);
    }

    resolve(size);
  });
});

export function getFileSizeInBytes(filename: string): number {
  if (fs.existsSync(filename)) {
    const stats = fs.statSync(filename);
    const fileSizeInBytes = stats.size;
    return fileSizeInBytes;
  }

  return 0;
}

export default getFolderSize;
