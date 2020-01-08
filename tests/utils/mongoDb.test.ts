//During the test the env variable is set to test
process.env.NODE_ENV = 'dev';
delete require.cache[require.resolve('../../src/utils/configUtils')];
delete require.cache[require.resolve('../../src/utils/mongoDb')];

import DbMetadatas from '../../src/models/Metadata';
import CheckDbVersion, {expectedVersion} from '../../src/utils/mongoDb';

import ignoredErrorMessages, {restoreLogger, mockLogger} from '../MockLogger';

import chai from 'chai';

const expect = chai.expect;
const should = chai.should();

describe("Test of monDb utils", () =>{
    before(async() => {
        await DbMetadatas.remove({});
        mockLogger();
        ignoredErrorMessages.push('The current version');
    });
    
    afterEach(async ()=>{
        await DbMetadatas.remove({});
    });

    after(async ()=>{
        const version = new DbMetadatas({version: expectedVersion});
        await version.save();
        restoreLogger();
    });

    it("When the db release does not match with the current db release number, it should throw an excption", (done) => {
        // Arrange
        const version = new DbMetadatas({version: expectedVersion + 1});
        version.save().then(() => {
            // Act
            CheckDbVersion().catch(() => {
                // Assert
                done();
            });  
        }); 
    });

    it("When the db release does match with the current db release number, it throw an exception", (done) => {
        // Arrange
        const version = new DbMetadatas({version: expectedVersion});
        version.save().then(() => {
            CheckDbVersion().then(() => {
                // Assert
                done();
            });
        });
    });
});