import mongoose from 'mongoose';

import { getUser } from '../utils/requestContext';
import Assets, { IAssets } from './Assets';
import { IUser } from './Users';

export interface IAssetUser extends mongoose.Document {
  assetId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  readonly?: boolean;

  exportToJSON(): any;
}

export const AssetUserSchema = new mongoose.Schema<IAssetUser>({
  assetId: mongoose.Types.ObjectId,
  readonly: Boolean,
  userId: mongoose.Types.ObjectId,
});

AssetUserSchema.methods.exportToJSON = async function () {
  return {
    readonly: this.readonly,
  };
};

const AssetUser = mongoose.model<IAssetUser>('AssetUser', AssetUserSchema);
export default AssetUser;

export const createUserAssetLink = async ({ user, asset, readonly }: { user: IUser, asset: IAssets, readonly?: boolean }) => {
  const newAssetUserLink = new AssetUser({ assetId: asset._id, userId: user._id, readonly });
  return newAssetUserLink.save();
};

export const getAssetsOwnedByUser = async (owner: IUser): Promise<IAssets[]> => {
  const userAssetIds = await AssetUser.find({ userId: owner._id, readonly: false });

  const assets = userAssetIds.map((userAsset) => Assets.findOne({ _id: userAsset.assetId }));

  return Promise.all(assets);
};

export const getUserAssets = async (): Promise<IAssets[]> => {
  const userAssetIds = await AssetUser.find({ userId: getUser()._id });

  const assets = userAssetIds.map((userAsset) => Assets.findOne({ _id: userAsset.assetId }));

  return Promise.all(assets);
};

export const deleteAssetUserModel = async (assetId: mongoose.Types.ObjectId): Promise<IAssetUser[]> => {
  const assetUserModels = await AssetUser.find({ assetId });
  return Promise.all(assetUserModels.map((assetUserModel) => assetUserModel.remove()));
};
