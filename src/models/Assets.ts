import mongoose from 'mongoose';

import AssetUser, { getUserAssets } from './AssetUser';
import Equipments from './Equipments';

export interface IAssets extends mongoose.Document {
  _uiId: string;
  brand: string;
  manufactureDate: Date;
  modelBrand: string;
  name: string;

  isOwnedByCurrentUser(): Promise<boolean>;
  exportToJSON(): Promise<object>;
}

export const AssetsSchema = new mongoose.Schema<IAssets>({
  _uiId: String,
  brand: String,
  manufactureDate: Date,
  modelBrand: String,
  name: String,
});

AssetsSchema.methods.exportToJSON = async function () {
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

AssetsSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const equipments = await Equipments.find({ assetId: this._id });
  const equipmentDeletionPromises = equipments.map((equipment) => equipment.deleteOne());
  await Promise.all(equipmentDeletionPromises);

  await AssetUser.deleteMany({ assetId: this._id });
});

const Assets = mongoose.model<IAssets>('Assets', AssetsSchema);
export default Assets;

export const getAsset = async (assetId: mongoose.Types.ObjectId): Promise<IAssets> => Assets.findById(assetId);

export const getAssetByUiId = async (assetUiId: string): Promise<IAssets | undefined> => {
  const assetsAccessible = await getUserAssets();
  return assetsAccessible.find((asset) => asset._uiId === assetUiId);
};
