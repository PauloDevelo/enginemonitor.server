//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

import ignoredErrorMessages, {restoreLogger, mockLogger} from '../MockLogger';

import fs from 'fs';
import rimraf from 'rimraf';

import server from '../../src/server';
const app = server.app;

const chai = require('chai')
  , chaiHttp = require('chai-http')
  , chaiString = require('chai-string')
  , chaiFs = require('chai-fs');
 
chai.use(chaiHttp);
chai.use(chaiString);
chai.use(chaiFs);
const expect = chai.expect;
const should = chai.should();

import Images from '../../src/models/Images';
import Users, { IUser } from '../../src/models/Users';
import Equipments, { IEquipments } from '../../src/models/Equipments';
import config from '../../src/utils/configUtils';
import Assets, { IAssets } from '../../src/models/Assets';
import AssetUser from '../../src/models/AssetUser';

describe('Images', () => {
    let user: IUser;

    let roUser: IUser;
    let roUserJWT: string;

    let boat: IAssets;
    let engine: IEquipments;

    before(async() => {
        await cleanUp();
        mockLogger();
        ignoredErrorMessages.push("Cannot read property '_id'");
        ignoredErrorMessages.push("userExceedStorageLimit");
        ignoredErrorMessages.push("Cannot read property 'toJSON'");
    });

    after(() => {
        restoreLogger();
    });

    beforeEach(async() => {
        user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
        user.setPassword("test");
        user = await user.save();

        roUser = new Users({ name: "read", firstname: "only", email: "read.only@gmail.com", forbidUploadingImage: true });
        roUser.setPassword("test");
        roUser = await roUser.save();
        roUserJWT = `Token ${roUser.generateJWT()}`;

        boat = new Assets({_uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',});
        boat = await boat.save();

        let assetUserLink = new AssetUser({ assetId: boat._id, userId: user._id });
        assetUserLink = await assetUserLink.save();

        let assetRoUserLink = new AssetUser({ assetId: boat._id, userId: roUser._id, readonly: true });
        assetRoUserLink = await assetRoUserLink.save();

        engine = new Equipments({name: "Engine", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"engine_01"});
        engine.assetId = boat._id;
        engine = await  engine.save();
    });

    afterEach(async() => await cleanUp());

    const cleanUp = async () => {
        await Images.deleteMany({}); 
        await Users.deleteMany({});
        await AssetUser.deleteMany({});
        await Assets.deleteMany({});
        await Equipments.deleteMany({});

        await new Promise((resolve, reject) => {
            rimraf('./tests/uploads/*', () => { 
                resolve();
            });
        });
    }

    describe('/GET/:parentUiId images', () => {
        it('it should GET a 200 http code as a result because images were returned successfully', async () => {
            // Arrange
            fs.copyFileSync('tests/toUpload/image1.jpeg', config.get("ImageFolder") + 'image1.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', config.get("ImageFolder") + 'thumbnail1.jpeg');
            fs.copyFileSync('tests/toUpload/image2.jpeg', config.get("ImageFolder") + 'image2.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail2.jpeg', config.get("ImageFolder") + 'thumbnail2.jpeg');
            fs.copyFileSync('tests/toUpload/image3.jpeg', config.get("ImageFolder") + 'image3.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail3.jpeg', config.get("ImageFolder") + 'thumbnail3.jpeg');

            const image1Path = config.get("ImageFolder") + "image1.jpeg";
            const thumbnail1Path = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: "engine_01" , path:image1Path, thumbnailPath:thumbnail1Path, title:"image1"});
            image1 = await image1.save();

            const image2Path = config.get("ImageFolder") + "image2.jpeg";
            const thumbnail2Path = config.get("ImageFolder") + "thumbnail2.jpeg";
            let image2 = new Images({ _uiId: "image_02", description: "image 2 description", name: "image2", parentUiId: "engine_01" , path:image2Path, thumbnailPath:thumbnail2Path, title:"image2"});
            image2 = await image2.save();

            const image3Path = config.get("ImageFolder") + "image3.jpeg";
            const thumbnail3Path = config.get("ImageFolder") + "thumbnail3.jpeg";
            let image3 = new Images({ _uiId: "image_03", description: "image 3 description", name: "image3", parentUiId: "engine_01" , path:image3Path, thumbnailPath:thumbnail3Path, title:"image3"});
            image3 = await image3.save();

            // Act
            let res = await chai.request(app).get('/api/images/' + engine._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("images");
            res.body.images.should.be.a("array");
            res.body.images.length.should.be.eql(3);

            res.body.images[0].should.have.property("name");
            res.body.images[0].name.should.be.eql("image1");

            res.body.images[0].should.have.property("description");
            res.body.images[0].description.should.be.eql("image 1 description");

            res.body.images[0].should.have.property("parentUiId");
            res.body.images[0].parentUiId.should.be.eql("engine_01");

            res.body.images[0].should.have.property("sizeInByte");
            res.body.images[0].sizeInByte.should.be.eql(297235);

            res.body.images[0].should.have.property("thumbnailUrl");
            res.body.images[0].thumbnailUrl.should.be.eql("http://localhost:8000/api/uploads/thumbnail1.jpeg");

            res.body.images[0].should.have.property("title");
            res.body.images[0].title.should.be.eql("image1");

            res.body.images[0].should.have.property("url");
            res.body.images[0].url.should.be.eql("http://localhost:8000/api/uploads/image1.jpeg");

 
            res.body.images[1].should.have.property("name");
            res.body.images[1].name.should.be.eql("image2");

            res.body.images[1].should.have.property("description");
            res.body.images[1].description.should.be.eql("image 2 description");

            res.body.images[1].should.have.property("parentUiId");
            res.body.images[1].parentUiId.should.be.eql("engine_01");

            res.body.images[1].should.have.property("sizeInByte");
            res.body.images[1].sizeInByte.should.be.eql(297235);

            res.body.images[1].should.have.property("thumbnailUrl");
            res.body.images[1].thumbnailUrl.should.be.eql("http://localhost:8000/api/uploads/thumbnail2.jpeg");

            res.body.images[1].should.have.property("title");
            res.body.images[1].title.should.be.eql("image2");

            res.body.images[1].should.have.property("url");
            res.body.images[1].url.should.be.eql("http://localhost:8000/api/uploads/image2.jpeg");


            res.body.images[2].should.have.property("name");
            res.body.images[2].name.should.be.eql("image3");

            res.body.images[2].should.have.property("description");
            res.body.images[2].description.should.be.eql("image 3 description");

            res.body.images[2].should.have.property("parentUiId");
            res.body.images[2].parentUiId.should.be.eql("engine_01");

            res.body.images[2].should.have.property("sizeInByte");
            res.body.images[2].sizeInByte.should.be.eql(297235);

            res.body.images[2].should.have.property("thumbnailUrl");
            res.body.images[2].thumbnailUrl.should.be.eql("http://localhost:8000/api/uploads/thumbnail3.jpeg");

            res.body.images[2].should.have.property("title");
            res.body.images[2].title.should.be.eql("image3");

            res.body.images[2].should.have.property("url");
            res.body.images[2].url.should.be.eql("http://localhost:8000/api/uploads/image3.jpeg");
            
        });

        it('it should GET a 200 http code as a result for the read only user', async () => {
            // Arrange
            fs.copyFileSync('tests/toUpload/image1.jpeg', config.get("ImageFolder") + 'image1.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', config.get("ImageFolder") + 'thumbnail1.jpeg');
            fs.copyFileSync('tests/toUpload/image2.jpeg', config.get("ImageFolder") + 'image2.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail2.jpeg', config.get("ImageFolder") + 'thumbnail2.jpeg');
            fs.copyFileSync('tests/toUpload/image3.jpeg', config.get("ImageFolder") + 'image3.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail3.jpeg', config.get("ImageFolder") + 'thumbnail3.jpeg');

            const image1Path = config.get("ImageFolder") + "image1.jpeg";
            const thumbnail1Path = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: "engine_01" , path:image1Path, thumbnailPath:thumbnail1Path, title:"image1"});
            image1 = await image1.save();

            const image2Path = config.get("ImageFolder") + "image2.jpeg";
            const thumbnail2Path = config.get("ImageFolder") + "thumbnail2.jpeg";
            let image2 = new Images({ _uiId: "image_02", description: "image 2 description", name: "image2", parentUiId: "engine_01" , path:image2Path, thumbnailPath:thumbnail2Path, title:"image2"});
            image2 = await image2.save();

            const image3Path = config.get("ImageFolder") + "image3.jpeg";
            const thumbnail3Path = config.get("ImageFolder") + "thumbnail3.jpeg";
            let image3 = new Images({ _uiId: "image_03", description: "image 3 description", name: "image3", parentUiId: "engine_01" , path:image3Path, thumbnailPath:thumbnail3Path, title:"image3"});
            image3 = await image3.save();

            // Act
            let res = await chai.request(app).get('/api/images/' + engine._uiId.toString()).set("Authorization", roUserJWT);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("images");
            res.body.images.should.be.a("array");
            res.body.images.length.should.be.eql(3);

            res.body.images[0].should.have.property("name");
            res.body.images[0].name.should.be.eql("image1");

            res.body.images[0].should.have.property("description");
            res.body.images[0].description.should.be.eql("image 1 description");

            res.body.images[0].should.have.property("parentUiId");
            res.body.images[0].parentUiId.should.be.eql("engine_01");

            res.body.images[0].should.have.property("sizeInByte");
            res.body.images[0].sizeInByte.should.be.eql(297235);

            res.body.images[0].should.have.property("thumbnailUrl");
            res.body.images[0].thumbnailUrl.should.be.eql("http://localhost:8000/api/uploads/thumbnail1.jpeg");

            res.body.images[0].should.have.property("title");
            res.body.images[0].title.should.be.eql("image1");

            res.body.images[0].should.have.property("url");
            res.body.images[0].url.should.be.eql("http://localhost:8000/api/uploads/image1.jpeg");

 
            res.body.images[1].should.have.property("name");
            res.body.images[1].name.should.be.eql("image2");

            res.body.images[1].should.have.property("description");
            res.body.images[1].description.should.be.eql("image 2 description");

            res.body.images[1].should.have.property("parentUiId");
            res.body.images[1].parentUiId.should.be.eql("engine_01");

            res.body.images[1].should.have.property("sizeInByte");
            res.body.images[1].sizeInByte.should.be.eql(297235);

            res.body.images[1].should.have.property("thumbnailUrl");
            res.body.images[1].thumbnailUrl.should.be.eql("http://localhost:8000/api/uploads/thumbnail2.jpeg");

            res.body.images[1].should.have.property("title");
            res.body.images[1].title.should.be.eql("image2");

            res.body.images[1].should.have.property("url");
            res.body.images[1].url.should.be.eql("http://localhost:8000/api/uploads/image2.jpeg");


            res.body.images[2].should.have.property("name");
            res.body.images[2].name.should.be.eql("image3");

            res.body.images[2].should.have.property("description");
            res.body.images[2].description.should.be.eql("image 3 description");

            res.body.images[2].should.have.property("parentUiId");
            res.body.images[2].parentUiId.should.be.eql("engine_01");

            res.body.images[2].should.have.property("sizeInByte");
            res.body.images[2].sizeInByte.should.be.eql(297235);

            res.body.images[2].should.have.property("thumbnailUrl");
            res.body.images[2].thumbnailUrl.should.be.eql("http://localhost:8000/api/uploads/thumbnail3.jpeg");

            res.body.images[2].should.have.property("title");
            res.body.images[2].title.should.be.eql("image3");

            res.body.images[2].should.have.property("url");
            res.body.images[2].url.should.be.eql("http://localhost:8000/api/uploads/image3.jpeg");
            
        });

        it('it should GET a 400 http code as a result because the user does not exist', async () => {
            // Arrange
            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");

            const imagePath = config.get("ImageFolder") + "image1.jpeg";
            const thumbnailPath = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: "engine_01" , path:imagePath, thumbnailPath:thumbnailPath, title:"image1"});
            image1 = await image1.save();

            // Act
            let res = await chai.request(app).get('/api/images/'+ engine._uiId.toString()).set("Authorization", "Token " + fakeUser.generateJWT());

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 400 http code as a result because the current user is not the boat owner', async () => {
            // Arrange
            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");
            fakeUser = await fakeUser.save();

            const imagePath = config.get("ImageFolder") + "image1.jpeg";
            const thumbnailPath = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: "engine_01" , path:imagePath, thumbnailPath:thumbnailPath, title:"image1"});
            image1 = await image1.save();

            // Act
            let res = await chai.request(app).get('/api/images/'+ engine._uiId.toString()).set("Authorization", "Token " + fakeUser.generateJWT());

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 200 http code as a result because it is possible to get an image before the parent was even created', async () => {
            // Arrange
            fs.copyFileSync('tests/toUpload/image1.jpeg', 'tests/uploads/image1.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', 'tests/uploads/thumbnail1.jpeg');

            const imagePath = config.get("ImageFolder") + "image1.jpeg";
            const thumbnailPath = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: "engine_01" , path:imagePath, thumbnailPath:thumbnailPath, title:"image1"});
            image1 = await image1.save();

            // Act
            let res = await chai.request(app).get('/api/images/'+ engine._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("images");
            res.body.images.should.be.a("array");
            res.body.images.length.should.be.eql(1);

            res.body.images[0].should.have.property("name");
            res.body.images[0].name.should.be.eql("image1");

            res.body.images[0].should.have.property("description");
            res.body.images[0].description.should.be.eql("image 1 description");

            res.body.images[0].should.have.property("parentUiId");
            res.body.images[0].parentUiId.should.be.eql("engine_01");

            res.body.images[0].should.have.property("sizeInByte");
            res.body.images[0].sizeInByte.should.be.eql(297235);

            res.body.images[0].should.have.property("thumbnailUrl");
            res.body.images[0].thumbnailUrl.should.be.eql("http://localhost:8000/api/uploads/thumbnail1.jpeg");

            res.body.images[0].should.have.property("title");
            res.body.images[0].title.should.be.eql("image1");

            res.body.images[0].should.have.property("url");
            res.body.images[0].url.should.be.eql("http://localhost:8000/api/uploads/image1.jpeg");
        });
    });

    describe('/POST/:parentUiId new image', () => {
        it('it should GET a 200 http code as a result because the image was added successfully', async () => {
            // Arrange

            // Act
            let res = await chai.request(app).post('/api/images/' + engine._uiId.toString())
            .field('name', 'my first image added')
            .field('_uiId', "image_added_01")
            .field('parentUiId', engine._uiId)
            .attach('imageData', fs.readFileSync('tests/toUpload/image4.jpeg'), engine._uiId + ".jpeg")
            .attach('thumbnail', fs.readFileSync('tests/toUpload/thumbnail4.jpeg'), "thumbnail_" + engine._uiId + ".jpeg")
            .set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("image");
            res.body.image.should.be.a("object");

            res.body.image._uiId.should.be.eql("image_added_01");
            res.body.image.name.should.be.eql("my first image added");
            res.body.image.parentUiId.should.be.eql(engine._uiId);
            res.body.image.sizeInByte.should.be.eql(221607);

            chai.string.startsWith(res.body.image.thumbnailUrl, "http://localhost:8000/api/uploads/" + user._id.toString()).should.be.true;
            chai.string.endsWith(res.body.image.thumbnailUrl, "thumbnail_" + engine._uiId + ".jpeg").should.be.true;

            chai.string.startsWith(res.body.image.url, "http://localhost:8000/api/uploads/" + user._id.toString()).should.be.true;
            chai.string.endsWith(res.body.image.url, engine._uiId + ".jpeg").should.be.true;

            const imageFilename = res.body.image.url.replace("http://localhost:8000/api/uploads/" + user._id.toString() + "/", "");
            const thumbnailFilename = res.body.image.thumbnailUrl.replace("http://localhost:8000/api/uploads/" + user._id.toString() + "/", "");
            expect(config.get("ImageFolder")+user._id.toString()).to.be.a.directory().with.files([imageFilename, thumbnailFilename]);
        });

        it('it should GET a 400 http code and a credential error as a result because the user readonly does not have credential', async () => {
            // Arrange

            // Act
            let res = await chai.request(app).post('/api/images/' + engine._uiId.toString())
            .field('name', 'my first image added')
            .field('_uiId', "image_added_01")
            .field('parentUiId', engine._uiId)
            .attach('imageData', fs.readFileSync('tests/toUpload/image4.jpeg'), engine._uiId + ".jpeg")
            .attach('thumbnail', fs.readFileSync('tests/toUpload/thumbnail4.jpeg'), "thumbnail_" + engine._uiId + ".jpeg")
            .set("Authorization", roUserJWT);

            // Assert
            res.should.have.status(400);
            res.body.errors.should.be.eql('credentialError');
        });

        it('it should get a 500 http code error as a result because the user storage is full', async () => {
            // Arrange
            let res = await chai.request(app).post('/api/images/' + engine._uiId.toString())
            .field('name', 'my first image added')
            .field('_uiId', "image_added_01")
            .field('parentUiId', engine._uiId)
            .attach('imageData', fs.readFileSync('tests/toUpload/image4.jpeg'), engine._uiId + ".jpeg")
            .attach('thumbnail', fs.readFileSync('tests/toUpload/thumbnail4.jpeg'), "thumbnail_" + engine._uiId + ".jpeg")
            .set("Authorization", "Token " + user.generateJWT());

            const maxAttempt = 20;
            let attemptNum = 1;

            // Act
            while(res.status === 200 && attemptNum++ < maxAttempt){
                res = await chai.request(app).post('/api/images/' + engine._uiId.toString())
                .field('name', 'my first image added')
                .field('_uiId', "image_added_01")
                .field('parentUiId', engine._uiId)
                .attach('imageData', fs.readFileSync('tests/toUpload/image4.jpeg'), `${engine._uiId}_${attemptNum}.jpeg`)
                .attach('thumbnail', fs.readFileSync('tests/toUpload/thumbnail4.jpeg'), `thumbnail_${engine._uiId}_${attemptNum}.jpeg`)
                .set("Authorization", "Token " + user.generateJWT());
            }

            // Assert
            res.should.have.status(500);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.message.should.be.eql("userExceedStorageLimit");

            const successfulAttempts = attemptNum - 1;
            expect(config.get("ImageFolder")+user._id.toString()).to.be.a.directory().with.files.have.lengthOf(successfulAttempts * 2);
        });

        it('it should GET a 422 http code as a result because the _uiId was missing', async () => {
            // Arrange

            // Act
            let res = await chai.request(app).post('/api/images/' + engine._uiId)
            .field('name', 'my first image added')
            .field('parentUiId', engine._uiId)
            .attach('imageData', fs.readFileSync('tests/toUpload/image4.jpeg'), engine._uiId + ".jpeg")
            .attach('thumbnail', fs.readFileSync('tests/toUpload/thumbnail4.jpeg'), "thumbnail_" + engine._uiId + ".jpeg")
            .set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("_uiId");
            res.body.errors._uiId.should.be.eql("isrequired");

            expect(config.get("ImageFolder")+user._id.toString()).to.be.a.directory().and.empty;
        });

        it('it should GET a 422 http code as a result because the name was missing', async () => {
            // Arrange

            // Act
            let res = await chai.request(app).post('/api/images/' + engine._uiId.toString())
            .field('_uiId', "image_added_01")
            .field('parentUiId', engine._uiId)
            .attach('imageData', fs.readFileSync('tests/toUpload/image4.jpeg'), engine._uiId + ".jpeg")
            .attach('thumbnail', fs.readFileSync('tests/toUpload/thumbnail4.jpeg'), "thumbnail_" + engine._uiId + ".jpeg")
            .set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("name");
            res.body.errors.name.should.be.eql("isrequired");

            expect(config.get("ImageFolder")+user._id.toString()).to.be.a.directory().and.empty;
        });

        it('it should GET a 422 http code as a result because the parentUiId was missing', async () => {
            // Arrange
            
            // Act
            let res = await chai.request(app).post('/api/images/' + engine._uiId.toString())
            .field('_uiId', "image_added_01")
            .field('name', 'my first image added')
            .attach('imageData', fs.readFileSync('tests/toUpload/image4.jpeg'), engine._uiId + ".jpeg")
            .attach('thumbnail', fs.readFileSync('tests/toUpload/thumbnail4.jpeg'), "thumbnail_" + engine._uiId + ".jpeg")
            .set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("parentUiId");
            res.body.errors.parentUiId.should.be.eql("isrequired");

            expect(config.get("ImageFolder")+user._id.toString()).to.be.a.directory().and.empty;
        });

        it('it should GET a 400 http code as a result because the user does not exist', async () => {
            // Arrange
            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");

            // Act
            let res = await chai.request(app).post('/api/images/' + engine._uiId)
            .field('name', 'my first image added')
            .field('_uiId', "image_added_01")
            .field('parentUiId', engine._uiId)
            .attach('imageData', fs.readFileSync('tests/toUpload/image4.jpeg'), engine._uiId + ".jpeg")
            .attach('thumbnail', fs.readFileSync('tests/toUpload/thumbnail4.jpeg'), "thumbnail_" + engine._uiId + ".jpeg")
            .set("Authorization", "Token " + fakeUser.generateJWT());

            // Assert
            res.should.have.status(400);
            expect(config.get("ImageFolder")).to.be.a.directory().and.empty;
        });

        it('it should GET a 400 http code as a result because the current user is not the boat owner', async () => {
            // Arrange
            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");
            fakeUser = await fakeUser.save();

            // Act
            let res = await chai.request(app).post('/api/images/' + engine._uiId.toString())
            .field('name', 'my first image added')
            .field('_uiId', "image_added_01")
            .field('parentUiId', engine._uiId)
            .attach('imageData', fs.readFileSync('tests/toUpload/image4.jpeg'), engine._uiId + ".jpeg")
            .attach('thumbnail', fs.readFileSync('tests/toUpload/thumbnail4.jpeg'), "thumbnail_" + engine._uiId + ".jpeg")
            .set("Authorization", "Token " + fakeUser.generateJWT());

            // Assert
            res.should.have.status(400);
            expect(config.get("ImageFolder")).to.be.a.directory().and.empty;
        });
    });

    describe('/POST/:parentUiId/:imageUiId change an image', () => {
        it('it should get a 200 http code as a result because the image name changed successfully', async () => {
            // Arrange
            fs.copyFileSync('tests/toUpload/image1.jpeg', config.get("ImageFolder") + 'image1.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', config.get("ImageFolder") + 'thumbnail1.jpeg');

            const image1Path = config.get("ImageFolder") + "image1.jpeg";
            const thumbnail1Path = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: "engine_01" , path:image1Path, thumbnailPath:thumbnail1Path, title:"image1"});
            image1 = (await image1.save());
            const jsonImage1 = await image1.toJSON()

            let jsonImage = {name:"image1 modified"};
            
            // Act
            let res = await chai.request(app).post('/api/images/'+ engine._uiId + '/' + jsonImage1._uiId).send({image: jsonImage}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("image");
            res.body.image.should.be.a("object");
            res.body.image.should.have.property("name");
            res.body.image.name.should.be.eql("image1 modified");
        });

        it('it should get a 400 http code and a credential error as a result because the read only user does not have enough credential to edit the image', async () => {
            // Arrange
            fs.copyFileSync('tests/toUpload/image1.jpeg', config.get("ImageFolder") + 'image1.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', config.get("ImageFolder") + 'thumbnail1.jpeg');

            const image1Path = config.get("ImageFolder") + "image1.jpeg";
            const thumbnail1Path = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: "engine_01" , path:image1Path, thumbnailPath:thumbnail1Path, title:"image1"});
            image1 = (await image1.save());
            const jsonImage1 = await image1.toJSON()

            let jsonImage = {name:"image1 modified"};
            
            // Act
            let res = await chai.request(app).post('/api/images/'+ engine._uiId + '/' + jsonImage1._uiId).send({image: jsonImage}).set("Authorization", roUserJWT);

            // Assert
            res.should.have.status(400);
            res.body.errors.should.be.eql('credentialError');
        });

        it('it should get a 200 http code as a result because the image description changed successfully', async () => {
            // Arrange
            fs.copyFileSync('tests/toUpload/image1.jpeg', config.get("ImageFolder") + 'image1.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', config.get("ImageFolder") + 'thumbnail1.jpeg');

            const image1Path = config.get("ImageFolder") + "image1.jpeg";
            const thumbnail1Path = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: "engine_01" , path:image1Path, thumbnailPath:thumbnail1Path, title:"image1"});
            image1 = (await image1.save());
            const jsonImage1 = await image1.toJSON()

            let jsonImage = {description:"image1 description modified"};
            
            // Act
            let res = await chai.request(app).post('/api/images/'+ engine._uiId + '/' + jsonImage1._uiId).send({image: jsonImage}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("image");
            res.body.image.should.be.a("object");
            res.body.image.should.have.property("description");
            res.body.image.description.should.be.eql("image1 description modified");
        });

        it('it should get a 400 http code as a result because the image does not belong to the boat of the request', async () => {
            // Arrange
            fs.copyFileSync('tests/toUpload/image1.jpeg', config.get("ImageFolder") + 'image1.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', config.get("ImageFolder") + 'thumbnail1.jpeg');


            let watermaker = new Equipments({name: "WaterMakert", brand:"Katadin", model:"Powersurvivor40", age:1234, installation:"2018/01/20", _uiId: "equipment_02"});
            watermaker.assetId = boat._id;
            watermaker = await  watermaker.save();

            const image1Path = config.get("ImageFolder") + "image1.jpeg";
            const thumbnail1Path = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: watermaker._uiId , path:image1Path, thumbnailPath:thumbnail1Path, title:"image1"});
            image1 = (await image1.save());
            const jsonImage1 = await image1.toJSON()

            let jsonImage = {name:"image1 modified"};
            
            // Act
            let res = await chai.request(app).post('/api/images/'+ engine._uiId + '/' + jsonImage1._uiId).send({image: jsonImage}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 400 http code as a result because the user does not exist', async () => {
            // Arrange
            fs.copyFileSync('tests/toUpload/image1.jpeg', config.get("ImageFolder") + 'image1.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', config.get("ImageFolder") + 'thumbnail1.jpeg');

            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");

            const image1Path = config.get("ImageFolder") + "image1.jpeg";
            const thumbnail1Path = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: engine._uiId , path:image1Path, thumbnailPath:thumbnail1Path, title:"image1"});
            image1 = (await image1.save());
            const jsonImage1 = await image1.toJSON()

            let jsonImage = {name:"image1 modified"};

            // Act
            let res = await chai.request(app).post('/api/images/'+ engine._uiId + '/' + jsonImage1._uiId).send({image: jsonImage}).set("Authorization", "Token " + fakeUser.generateJWT());

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 400 http code as a result because the current user is not the boat owner', async () => {
            // Arrange
            fs.copyFileSync('tests/toUpload/image1.jpeg', config.get("ImageFolder") + 'image1.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', config.get("ImageFolder") + 'thumbnail1.jpeg');

            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");
            fakeUser = await fakeUser.save();

            const image1Path = config.get("ImageFolder") + "image1.jpeg";
            const thumbnail1Path = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: engine._uiId , path:image1Path, thumbnailPath:thumbnail1Path, title:"image1"});
            image1 = (await image1.save());
            const jsonImage1 = await image1.toJSON()

            let jsonImage = {name:"image1 modified"};

             // Act
             let res = await chai.request(app).post('/api/images/'+ engine._uiId + '/' + jsonImage1._uiId).send({image: jsonImage}).set("Authorization", "Token " + fakeUser.generateJWT());

            // Assert
            res.should.have.status(400);
        });
    });

    describe('/DELETE/:parentUiId/:imageUiId delete image', () => {
        it('it should get a 200 http code as a result because the orphan image was deleted successfully', async () => {
            // Arrange
            fs.copyFileSync('tests/toUpload/image1.jpeg', config.get("ImageFolder") + 'image1.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', config.get("ImageFolder") + 'thumbnail1.jpeg');

            const image1Path = config.get("ImageFolder") + "image1.jpeg";
            const thumbnail1Path = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: "watermaker_01" , path:image1Path, thumbnailPath:thumbnail1Path, title:"image1"});
            image1 = (await image1.save());

            // Act
            let res = await chai.request(app).delete(`/api/images/watermaker_01/${image1._uiId}`).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("image");
            res.body.image.should.be.a("object");
            res.body.image.should.not.have.property("_id");
            res.body.image.should.have.property("_uiId");
            res.body.image._uiId.should.be.eql(image1._uiId.toString());

            expect(config.get("ImageFolder")).to.be.a.directory().and.empty;
        });

        it('it should get a 200 http code as a result because the image was deleted successfully', async () => {
            // Arrange
            fs.copyFileSync('tests/toUpload/image1.jpeg', config.get("ImageFolder") + 'image1.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', config.get("ImageFolder") + 'thumbnail1.jpeg');

            const image1Path = config.get("ImageFolder") + "image1.jpeg";
            const thumbnail1Path = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: engine._uiId , path:image1Path, thumbnailPath:thumbnail1Path, title:"image1"});
            image1 = (await image1.save());

            // Act
            let res = await chai.request(app).delete('/api/images/'+ engine._uiId + '/' + image1._uiId).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("image");
            res.body.image.should.be.a("object");
            res.body.image.should.not.have.property("_id");
            res.body.image.should.have.property("_uiId");
            res.body.image._uiId.should.be.eql(image1._uiId.toString());

            expect(config.get("ImageFolder")).to.be.a.directory().and.empty;
        });

        it('it should get a 400 http code and a credential error because the read only user does not have credential', async () => {
            // Arrange
            fs.copyFileSync('tests/toUpload/image1.jpeg', config.get("ImageFolder") + 'image1.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', config.get("ImageFolder") + 'thumbnail1.jpeg');

            const image1Path = config.get("ImageFolder") + "image1.jpeg";
            const thumbnail1Path = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: engine._uiId , path:image1Path, thumbnailPath:thumbnail1Path, title:"image1"});
            image1 = (await image1.save());

            // Act
            let res = await chai.request(app).delete('/api/images/'+ engine._uiId + '/' + image1._uiId).set("Authorization", roUserJWT);

            // Assert
            res.should.have.status(400);
            res.body.errors.should.be.eql('credentialError');
        });

        it('it should get a 400 http code as a result because the image does not exist', async () => {
            // Arrange
            fs.copyFileSync('tests/toUpload/image1.jpeg', config.get("ImageFolder") + 'image1.jpeg');
            fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', config.get("ImageFolder") + 'thumbnail1.jpeg');

            const image1Path = config.get("ImageFolder") + "image1.jpeg";
            const thumbnail1Path = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: engine._uiId , path:image1Path, thumbnailPath:thumbnail1Path, title:"image1"});
            
            // Act
            let res = await chai.request(app).delete('/api/images/'+ engine._uiId + '/' + image1._uiId).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(400);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("entity");
            res.body.errors.entity.should.be.eql("notfound");           
        });
    });
});