import {isTest} from "./configUtils";

export const expectedVersion = 0.5;

import { rejects } from "assert";
import DbMetadatas from "../models/Metadata";

export default async function CheckDbVersion(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (isTest) {
            resolve();
        } else {
            DbMetadatas.findOne().then((dbMetadataDoc) => {
                if (dbMetadataDoc.version !== expectedVersion) {
                    const  errorMessage: string = `The current version ${dbMetadataDoc.version} doesn't match with the expected version ${expectedVersion}. Please upgrade the database.`;
                    throw new Error(errorMessage);
                } else {
                    resolve();
                }
            }).catch((reason) => {
                reject(reason);
            });
        }
    });
}
