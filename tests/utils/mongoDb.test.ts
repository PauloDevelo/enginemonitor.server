//During the test the env variable is set to test
process.env.NODE_ENV = 'dev';

import CheckDbVersion, {DbMetadatas, IDbMetada, expectedVersion} from '../../src/utils/mongoDb';

import chai from 'chai';

const expect = chai.expect;
const should = chai.should();

describe("Test of monDb utils", () =>{

    before(async ()=>{
        await DbMetadatas.remove({});
    });
    
    afterEach(async ()=>{
        await DbMetadatas.remove({});
    });

    after(async ()=>{
        const version = new DbMetadatas({version: expectedVersion});
        await version.save();
    });

    it("When the db release does not match with the current db release number, it should return false", async () => {
        // Arrange
        const version = new DbMetadatas({version: expectedVersion + 1});
        await version.save();

        let success = false;
        const callBackOnSuccess = () => {success = true;}

        // Act
        await CheckDbVersion(callBackOnSuccess);

        // Assert
        success.should.be.false;
    });

    it("When the db release does match with the current db release number, it should return true", async() => {
        // Arrange
        const version = new DbMetadatas({version: expectedVersion});
        await version.save();

        let success = false;
        const callBackOnSuccess = () => {success = true;}

        // Act
        await CheckDbVersion(callBackOnSuccess);

        // Assert
        success.should.be.true;
    });
});