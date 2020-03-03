import mongoose from "mongoose";

export const GuestLinksSchema = new mongoose.Schema({
    _uiId: String,
    guestUserId: mongoose.Schema.Types.ObjectId,
    name: String,
    niceKey: String
});

GuestLinksSchema.methods.toJSON = function() {
  return {
    _uiId: this._uiId,
    name: this.name,
    niceKey: this.niceKey,
  };
};

export interface IGuestLink extends mongoose.Document {
  _uiId: string;
  guestUserId: mongoose.Types.ObjectId;
  name: string;
  niceKey: string;

  toJSON(): any;
}

export const getGuestLinkByNiceKey = async (niceKey: string): Promise<IGuestLink> => {
    const query = { niceKey };
    return await GuestLinks.findOne(query);
};

const GuestLinks = mongoose.model<IGuestLink>("GuestLinks", GuestLinksSchema);
export default GuestLinks;
