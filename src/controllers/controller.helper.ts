import * as express from "express";

import { getAssetByUiId } from "../models/Assets";
import AssetUser from "../models/AssetUser";

import {getUser} from "../utils/requestContext";

export const checkUserCredentials = async (method: string, assetUiId: string, res: express.Response, next: any) => {
  switch(method){
      case 'GET':
          next();
          break;
      case 'POST':
      case 'DELETE':
      default:
          const user = getUser();
          const asset = await getAssetByUiId(assetUiId);

          try{
            const assetUser = await AssetUser.findOne({ assetId: asset._id, userId: user._id });

            if(assetUser.readonly){
                return res.status(400).json({ errors: 'credentialError' });
            }
            next();
          }
          catch(error){
            return res.status(400).json({ errors: 'credentialError' });
          }
          
          return;
  }
}

export const checkCredentials = async (req: express.Request, res: express.Response, next: any) => {
  checkUserCredentials(req.method, req.params.assetUiId, res, next);
}