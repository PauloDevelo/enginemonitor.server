import mongoose from "mongoose";

import {getUser} from "../utils/requestContext";
import Assets, {IAssets} from "./Assets";
import { IUser } from "./Users";

export const AssetUserSchema = new mongoose.Schema({
  assetId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
});

export interface IAssetUser extends mongoose.Document {
  assetId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

export const createUserAssetLink = async (user: IUser, asset: IAssets) => {
  const assetUserLink = {
      assetId: asset._id,
      userId: user._id,
  };

  const newAssetUserLink = new AssetUser(assetUserLink);
  return await newAssetUserLink.save();
};

export const getUserAssets =  async (): Promise<IAssets[]> => {
  const userAssetIds = await AssetUser.find({ userId: getUser()._id });

  const assets = userAssetIds.map((userAsset) => {
    return Assets.findOne({ _id: userAsset.assetId });
  });

  return Promise.all(assets);
};

export const deleteAssetUserModel = async (assetId: mongoose.Types.ObjectId): Promise<IAssetUser> => {
    const assetUserModel = await AssetUser.findOne({ assetId });
    return assetUserModel.remove();
};

const AssetUser = mongoose.model<IAssetUser>("AssetUser", AssetUserSchema);
export default AssetUser;
