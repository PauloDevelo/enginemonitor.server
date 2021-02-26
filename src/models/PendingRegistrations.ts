import mongoose from 'mongoose';

export interface IPendingRegistration extends mongoose.Document {
  assetId: mongoose.Types.ObjectId;
  newOwnerEmail: string;
}

export const PendingRegistrationsSchema = new mongoose.Schema<IPendingRegistration>({
  assetId: mongoose.Schema.Types.ObjectId,
  newOwnerEmail: String,
});

const PendingRegistrations = mongoose.model<IPendingRegistration>('PendingRegistrations', PendingRegistrationsSchema);
export default PendingRegistrations;

export const getPendingRegistrations = async (newOwnerEmail: string): Promise<IPendingRegistration[]> => {
  const query = { newOwnerEmail };
  return PendingRegistrations.find(query);
};
