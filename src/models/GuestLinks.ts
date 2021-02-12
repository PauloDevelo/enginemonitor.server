import mongoose from 'mongoose';

export interface IGuestLink extends mongoose.Document {
  _uiId: string;
  guestUserId: mongoose.Types.ObjectId;
  name: string;
  niceKey: string;

  exportToJSON(): any;
}

export const GuestLinksSchema = new mongoose.Schema<IGuestLink>({
  _uiId: String,
  guestUserId: mongoose.Schema.Types.ObjectId,
  name: String,
  niceKey: String,
});

GuestLinksSchema.methods.exportToJSON = function () {
  return {
    _uiId: this._uiId,
    name: this.name,
    niceKey: this.niceKey,
  };
};

const GuestLinks = mongoose.model<IGuestLink>('GuestLinks', GuestLinksSchema);
export default GuestLinks;

export const getGuestLinkByNiceKey = async (niceKey: string): Promise<IGuestLink> => {
  const query = { niceKey };
  return GuestLinks.findOne(query);
};
