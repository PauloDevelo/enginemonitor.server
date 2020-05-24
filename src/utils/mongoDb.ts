import {isTest} from "./configUtils";

export const expectedVersion = 0.9;

import { rejects } from "assert";
import DbMetadatas from "../models/Metadata";

export default async function getDbVersion(): Promise<number> {
    return new Promise((resolve, reject) => {
        if (isTest) {
            resolve();
        } else {
            DbMetadatas.findOne().then((dbMetadataDoc) => {
                if (dbMetadataDoc.version !== expectedVersion) {
                    const  errorMessage: string = `The current version ${dbMetadataDoc.version} doesn't match with the expected version ${expectedVersion}. Please upgrade the database.`;
                    throw new Error(errorMessage);
                } else {
                    resolve(dbMetadataDoc.version);
                }
            }).catch((reason) => {
                reject(reason);
            });
        }
    });
}
