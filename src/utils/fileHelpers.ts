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

export default getFolderSize;
