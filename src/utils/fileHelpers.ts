import fs from "fs";
import getSize from "get-folder-size";

const getFolderSize = (myFolder: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        getSize(myFolder, (err: any, size: number) => {
            if (err) {
                reject(err);
            }

            resolve(size);
        });
    });
};

export function getFileSizeInBytes(filename: string): number {
    const stats = fs.statSync(filename);
    const fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}

export default getFolderSize;
