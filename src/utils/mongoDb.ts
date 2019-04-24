import config, {isDev, isTest} from "./configUtils";
import logger from "./logger";

const expectedVersion = 0.2;

import mongoose, { Schema } from "mongoose";

// Configure mongoose's promise to global promise
mongoose.Promise = global.Promise;

// Configure Mongoose
mongoose.connect("mongodb:" + config.get("DBHost"), {useNewUrlParser: true});
if (isDev) {
  mongoose.set("debug", true);
}

const DbMetadaSchema = new mongoose.Schema({ version: Number });
interface IDbMetada extends mongoose.Document {
    version: number;
}

const DbMetadatas = mongoose.model<IDbMetada>("DbMetadatas", DbMetadaSchema);

export default async function CheckDbVersion(callBackOnSuccess: () => void): Promise<void> {
    try {
        if (isTest) {
            callBackOnSuccess();
        } else {
            const dbMetadataDoc = await DbMetadatas.findOne();

            if (dbMetadataDoc.version !== expectedVersion) {
                // tslint:disable-next-line:max-line-length
                logger.error(`The current version ${dbMetadataDoc.version} doesn't match with the expected version ${expectedVersion}. Please upgrade the database.`);
            } else {
                callBackOnSuccess();
            }
        }
    } catch (err) {
        logger.error("Error when getting the version of the database", err);
    }

}
