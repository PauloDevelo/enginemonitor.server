import { NextFunction, Request, Response } from "express";
import fs from "fs";
import getSize from "get-folder-size";
import multer from "multer";

import config from "./configUtils";

import {getUser} from "./requestContext";

const getImageDirectory = (): string => {
    const user = getUser();
    return "./uploads/" + user._id;
};

const storage = multer.diskStorage({
    destination(req, file, cb) {
        const dir = getImageDirectory();

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        cb(null, dir);
    },
    filename(req, file, cb) {
        cb(null, Date.now() + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    storage,
});

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

export const checkImageQuota = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dir = getImageDirectory();
    const folderSize = await getFolderSize(dir);

    const folderSizeLimit = config.get("userImageFolderLimitInByte");

    if (folderSize > folderSizeLimit) {
        throw new Error("userExceedStorageLimit");
    }

    next();
};

export default upload;
