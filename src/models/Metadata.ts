import config, {isDev} from "../utils/configUtils";

import mongoose, { Schema } from "mongoose";

// Configure mongoose's promise to global promise
mongoose.Promise = global.Promise;

// Configure Mongoose
mongoose.connect("mongodb:" + config.get("DBHost"), {useNewUrlParser: true});
if (isDev) {
  mongoose.set("debug", true);
}

const DbMetadaSchema = new mongoose.Schema({ version: Number });
export interface IDbMetada extends mongoose.Document {
    version: number;
}

const DbMetadatas = mongoose.model<IDbMetada>("DbMetadatas", DbMetadaSchema);
export default DbMetadatas;