import {isTest} from "./configUtils";
import logger from "./logger";

export const expectedVersion = 0.4;

import DbMetadatas from "../models/Metadata";

export default async function CheckDbVersion(callBackOnSuccess: () => void): Promise<void> {
    try {
        if (isTest) {
            callBackOnSuccess();
        } else {
            const dbMetadataDoc = await DbMetadatas.findOne();

            if (dbMetadataDoc.version !== expectedVersion) {
                // tslint:disable-next-line:max-line-length
                const  errorMessage: string = `The current version ${dbMetadataDoc.version} doesn't match with the expected version ${expectedVersion}. Please upgrade the database.`;
                logger.error(errorMessage);
            } else {
                callBackOnSuccess();
            }
        }
    } catch (err) {
        logger.error("Error when getting the version of the database", err);
    }
}
