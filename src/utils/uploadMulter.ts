import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import multer from 'multer';

import getFolderSize from './fileHelpers';

import { getUser } from './requestContext';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = getUser().getUserImageFolder();

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    cb(null, dir);
  },
  filename(req, file, cb) {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  storage,
});

// eslint-disable-next-line max-len
export const checkImageQuota = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const user = getUser();
  const userFolder = user.getUserImageFolder();

  const folderSize = fs.existsSync(userFolder) ? await getFolderSize(userFolder) : 0;
  const folderSizeLimit = user.getUserImageFolderSizeLimitInByte();

  if (folderSize > folderSizeLimit) {
    throw new Error('userExceedStorageLimit');
  }

  next();
};

export default upload;
