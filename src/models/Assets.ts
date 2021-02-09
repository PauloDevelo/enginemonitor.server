import mongoose from 'mongoose';

import { deleteAssetUserModel, getUserAssets } from './AssetUser';
import { deleteEquipments } from './Equipments';

export const AssetsSchema = new mongoose.Schema({
  _uiId: String,
  brand: String,
  manufactureDate: Date,
  modelBrand: String,
  name: String,
});

AssetsSchema.methods.toJSON = async function () {
  return {
    _uiId: this._uiId,
    brand: this.brand,
    manufactureDate: this.manufactureDate,
    modelBrand: this.modelBrand,
    name: this.name,
  };
};

AssetsSchema.methods.isOwnedByCurrentUser = async function () {
  const assets = await getUserAssets();
  return assets.findIndex((asset) => asset.id === this.id) !== -1;
};

export interface IAssets extends mongoose.Document {
    _uiId: string;
    brand: string;
    manufactureDate: Date;
    modelBrand: string;
    name: string;

    isOwnedByCurrentUser(): Promise<boolean>;
    toJSON(): Promise<object>;
}

const Assets = mongoose.model<IAssets>('Assets', AssetsSchema);
export default Assets;

export const getAsset = async (assetId: mongoose.Types.ObjectId): Promise<IAssets> => Assets.findById(assetId);

export const getAssetByUiId = async (assetUiId: string): Promise<IAssets | undefined> => {
  const assetsAccessible = await getUserAssets();
  return assetsAccessible.find((asset) => asset._uiId === assetUiId);
};

export const deleteAssetModel = async (asset: IAssets): Promise<void> => {
  const promises: Array<PromiseLike<void>> = [];

  const deleteAssetUserModelPromise = async () => {
    await deleteAssetUserModel(asset._id);
  };

  const deleteAssetPromise = async () => {
    await asset.remove();
  };

  promises.push(deleteEquipments(asset._id));
  promises.push(deleteAssetUserModelPromise());
  promises.push(deleteAssetPromise());

  await Promise.all(promises);
};
