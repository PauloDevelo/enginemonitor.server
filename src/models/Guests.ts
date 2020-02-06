import mongoose from "mongoose";

export const GuestsSchema = new mongoose.Schema({
    guestUserId: mongoose.Schema.Types.ObjectId,
    name: String,
    niceKey: String,
    ownerUserId: mongoose.Schema.Types.ObjectId,
});

GuestsSchema.methods.toJSON = function() {
  return {
    name: this.name,
    niceKey: this.niceKey,
  };
};

export interface IGuests extends mongoose.Document {
  guestUserId: mongoose.Types.ObjectId;
  name: string;
  niceKey: string;
  ownerUserId: mongoose.Types.ObjectId;

  toJSON(): any;
}

export const getGuestByNiceKey = async (niceKey: string): Promise<IGuests> => {
    const query = { niceKey };
    return await Guests.findOne(query);
};

export const getGuestsByOwnerUserId = async (ownerUserId: mongoose.Types.ObjectId): Promise<IGuests[]> => {
  const query = { ownerUserId };
  return await Guests.find(query);
};

const Guests = mongoose.model<IGuests>("Guests", GuestsSchema);
export default Guests;
