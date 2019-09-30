//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

import fs from 'fs';

import server from '../../src/server';
const app = server.app;

const chai = require('chai')
  , chaiHttp = require('chai-http')
  , chaiString = require('chai-string');
 
chai.use(chaiHttp);
chai.use(chaiString);
const expect = chai.expect;
const should = chai.should();

import Images from '../../src/models/Images';
import Users from '../../src/models/Users';
import Equipments from '../../src/models/Equipments';
import config from '../../src/utils/configUtils';

describe('Images', () => {
    afterEach(async () => {
        await Images.deleteMany({}); 
        await Users.deleteMany({});
        await Equipments.deleteMany({});
    });

    describe('/GET/:parentUiId images', () => {
        it('it should GET a 200 http code as a result because images were returned successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            const image1Path = config.get("ImageFolder") + "image1.jpeg";
            const thumbnail1Path = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: "boat_01" , path:image1Path, thumbnailPath:thumbnail1Path, title:"image1"});
            image1 = await image1.save();

            const image2Path = config.get("ImageFolder") + "image2.jpeg";
            const thumbnail2Path = config.get("ImageFolder") + "thumbnail2.jpeg";
            let image2 = new Images({ _uiId: "image_02", description: "image 2 description", name: "image2", parentUiId: "boat_01" , path:image2Path, thumbnailPath:thumbnail2Path, title:"image2"});
            image2 = await image2.save();

            const image3Path = config.get("ImageFolder") + "image3.jpeg";
            const thumbnail3Path = config.get("ImageFolder") + "thumbnail3.jpeg";
            let image3 = new Images({ _uiId: "image_03", description: "image 3 description", name: "image3", parentUiId: "boat_01" , path:image3Path, thumbnailPath:thumbnail3Path, title:"image3"});
            image3 = await image3.save();

            // Act
            let res = await chai.request(app).get('/api/images/' + boat._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

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
            res.body.images[0].parentUiId.should.be.eql("boat_01");

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
            res.body.images[1].parentUiId.should.be.eql("boat_01");

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
            res.body.images[2].parentUiId.should.be.eql("boat_01");

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

            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            const imagePath = config.get("ImageFolder") + "image1.jpeg";
            const thumbnailPath = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: "boat_01" , path:imagePath, thumbnailPath:thumbnailPath, title:"image1"});
            image1 = await image1.save();

            // Act
            let res = await chai.request(app).get('/api/images/'+ boat._uiId.toString()).set("Authorization", "Token " + fakeUser.generateJWT());

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 400 http code as a result because the current user is not the boat owner', async () => {
            // Arrange
            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");
            fakeUser = await fakeUser.save();

            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            const imagePath = config.get("ImageFolder") + "image1.jpeg";
            const thumbnailPath = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: "boat_01" , path:imagePath, thumbnailPath:thumbnailPath, title:"image1"});
            image1 = await image1.save();

            // Act
            let res = await chai.request(app).get('/api/images/'+ boat._uiId.toString()).set("Authorization", "Token " + fakeUser.generateJWT());

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 200 http code as a result because it is possible to add an image before the boat was even created', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;

            const imagePath = config.get("ImageFolder") + "image1.jpeg";
            const thumbnailPath = config.get("ImageFolder") + "thumbnail1.jpeg";
            let image1 = new Images({ _uiId: "image_01", description: "image 1 description", name: "image1", parentUiId: "boat_01" , path:imagePath, thumbnailPath:thumbnailPath, title:"image1"});
            image1 = await image1.save();

            // Act
            let res = await chai.request(app).get('/api/images/'+ boat._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

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
            res.body.images[0].parentUiId.should.be.eql("boat_01");

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
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            // Act
            let res = await chai.request(app).post('/api/images/' + boat._uiId.toString())
            .field('name', 'my first image added')
            .field('_uiId', "image_added_01")
            .field('parentUiId', boat._uiId)
            .attach('imageData', fs.readFileSync('tests/toUpload/image4.jpeg'), boat._uiId + ".jpeg")
            .attach('thumbnail', fs.readFileSync('tests/toUpload/thumbnail4.jpeg'), "thumbnail_" + boat._uiId + ".jpeg")
            .set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("image");
            res.body.image.should.be.a("object");

            res.body.image._uiId.should.be.eql("image_added_01");
            res.body.image.name.should.be.eql("my first image added");
            res.body.image.parentUiId.should.be.eql(boat._uiId);
            res.body.image.sizeInByte.should.be.eql(221607);

            chai.string.startsWith(res.body.image.thumbnailUrl, "http://localhost:8000/api/uploads/" + user._id.toString()).should.be.true;
            chai.string.endsWith(res.body.image.thumbnailUrl, "thumbnail_" + boat._uiId + ".jpeg").should.be.true;

            chai.string.startsWith(res.body.image.url, "http://localhost:8000/api/uploads/" + user._id.toString()).should.be.true;
            chai.string.endsWith(res.body.image.url, boat._uiId + ".jpeg").should.be.true;
        });

    //     it('it should GET a 422 http code as a result because the entry _uiId was missing', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();

    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
    //         task.equipmentId = boat._id;
    //         task = await task.save();

    //         let entry = { date: new Date().toString(), age: 12345, remarks: "RAS" }

    //         // Act
    //         let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + 'any-ui-id').send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(422);
    //         res.body.should.have.property("errors");
    //         res.body.errors.should.be.a("object");
    //         res.body.errors.should.have.property("_uiId");
    //         res.body.errors._uiId.should.be.eql("isrequired");
    //     });

    //     it('it should GET a 422 http code as a result because the entry name was missing', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();

    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
    //         task.equipmentId = boat._id;
    //         task = await task.save();

    //         let entry = { date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" }

    //         // Act
    //         let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(422);
    //         res.body.should.have.property("errors");
    //         res.body.errors.should.be.a("object");
    //         res.body.errors.should.have.property("name");
    //         res.body.errors.name.should.be.eql("isrequired");
    //     });

    //     it('it should GET a 422 http code as a result because the entry date was missing', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();

    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
    //         task.equipmentId = boat._id;
    //         task = await task.save();

    //         let entry = { name: "My first vidange", age: 12345, remarks: "RAS", _uiId: "entry_01" };

    //         // Act
    //         let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(422);
    //         res.body.should.have.property("errors");
    //         res.body.errors.should.be.a("object");
    //         res.body.errors.should.have.property("date");
    //         res.body.errors.date.should.be.eql("isrequired");
    //     });

    //     it('it should GET a 422 http code as a result because the entry age was missing', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();

    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
    //         task.equipmentId = boat._id;
    //         task = await task.save();

    //         let entry = { name: "My first vidange", date: new Date().toString(), remarks: "RAS", _uiId: "entry_01" };

    //         // Act
    //         let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(422);
    //         res.body.should.have.property("errors");
    //         res.body.errors.should.be.a("object");
    //         res.body.errors.should.have.property("age");
    //         res.body.errors.age.should.be.eql("isrequired");
    //     });

    //     it('it should GET a 422 http code as a result because the entry remarks was missing', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();

    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
    //         task.equipmentId = boat._id;
    //         task = await task.save();

    //         let entry = { name: "My first vidange", date: new Date().toString(), age: 12345, _uiId: "entry_01" };

    //         // Act
    //         let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(422);
    //         res.body.should.have.property("errors");
    //         res.body.errors.should.be.a("object");
    //         res.body.errors.should.have.property("remarks");
    //         res.body.errors.remarks.should.be.eql("isrequired");
    //     });
    });

    // describe('/POST/:equipmentUiId/:taskUiId/:entryUiId change an entry', () => {
    //     it('it should get a 200 http code as a result because the orphan entry name changed successfully', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();

    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
    //         entry.equipmentId = boat._id;
    //         entry = await entry.save();

    //         let jsonEntry = {name:"Vidange d'huile"};
            
    //         // Act
    //         let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/-/' + entry._uiId.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(200);
    //         res.body.should.have.property("entry");
    //         res.body.entry.should.be.a("object");
    //         res.body.entry.should.have.property("name");
    //         res.body.entry.should.have.property("date");
    //         res.body.entry.should.have.property("age");
    //         res.body.entry.should.have.property("remarks");

    //         res.body.entry.name.should.be.eql("Vidange d'huile");
    //         res.body.entry.age.should.be.eql(12345);
    //         res.body.entry.remarks.should.be.eql("RAS");
    //     });

    //     it('it should get a 200 http code as a result because the entry name changed successfully', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();

    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
    //         task.equipmentId = boat._id;
    //         task = await task.save();

    //         let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
    //         entry.equipmentId = boat._id;
    //         entry.taskId = task._id;
    //         entry = await entry.save();

    //         let jsonEntry = {name:"Vidange d'huile"};
            
    //         // Act
    //         let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(200);
    //         res.body.should.have.property("entry");
    //         res.body.entry.should.be.a("object");
    //         res.body.entry.should.have.property("name");
    //         res.body.entry.should.have.property("date");
    //         res.body.entry.should.have.property("age");
    //         res.body.entry.should.have.property("remarks");

    //         res.body.entry.name.should.be.eql("Vidange d'huile");
    //         res.body.entry.age.should.be.eql(12345);
    //         res.body.entry.remarks.should.be.eql("RAS");
    //     });

    //     it('it should get a 200 http code as a result because the entry date changed successfully', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();

    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
    //         task.equipmentId = boat._id;
    //         task = await task.save();

    //         let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
    //         entry.equipmentId = boat._id;
    //         entry.taskId = task._id;
    //         entry = await entry.save();

    //         let jsonEntry = { date: "2018-10-12" };
            
    //         // Act
    //         let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(200);
    //         res.body.should.have.property("entry");
    //         res.body.entry.should.be.a("object");
    //         res.body.entry.should.have.property("name");
    //         res.body.entry.should.have.property("date");
    //         res.body.entry.should.have.property("age");
    //         res.body.entry.should.have.property("remarks");

    //         res.body.entry.name.should.be.eql("My first entry");
    //         res.body.entry.date.should.be.eql( "2018-10-12T00:00:00.000Z");
    //         res.body.entry.age.should.be.eql(12345);
    //         res.body.entry.remarks.should.be.eql("RAS");
    //     });

    //     it('it should get a 200 http code as a result because the entry age changed successfully', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();

    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
    //         task.equipmentId = boat._id;
    //         task = await task.save();

    //         let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
    //         entry.equipmentId = boat._id;
    //         entry.taskId = task._id;
    //         entry = await entry.save();

    //         let jsonEntry = { age: 100 };
            
    //         // Act
    //         let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(200);
    //         res.body.should.have.property("entry");
    //         res.body.entry.should.be.a("object");
    //         res.body.entry.should.have.property("name");
    //         res.body.entry.should.have.property("date");
    //         res.body.entry.should.have.property("age");
    //         res.body.entry.should.have.property("remarks");

    //         res.body.entry.name.should.be.eql("My first entry");
    //         res.body.entry.age.should.be.eql(100);
    //         res.body.entry.remarks.should.be.eql("RAS");
    //     });

    //     it('it should get a 200 http code as a result because the entry remarks changed successfully', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();

    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
    //         task.equipmentId = boat._id;
    //         task = await task.save();

    //         let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
    //         entry.equipmentId = boat._id;
    //         entry.taskId = task._id;
    //         entry = await entry.save();

    //         let jsonEntry = { remarks: "remarks" };
            
    //         // Act
    //         let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(200);
    //         res.body.should.have.property("entry");
    //         res.body.entry.should.be.a("object");
    //         res.body.entry.should.have.property("name");
    //         res.body.entry.should.have.property("date");
    //         res.body.entry.should.have.property("age");
    //         res.body.entry.should.have.property("remarks");

    //         res.body.entry.name.should.be.eql("My first entry");
    //         res.body.entry.age.should.be.eql(12345);
    //         res.body.entry.remarks.should.be.eql("remarks");
    //     });

    //     it('it should get a 400 http code as a result because the entry does not belong to the boat of the request', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();
            
    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let boat2 = new Equipments({name: "Albatros", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_02"});
    //         boat2.ownerId = user._id;
    //         boat2 = await  boat2.save();

    //         let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
    //         task.equipmentId = boat2._id;
    //         task = await task.save();

    //         let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
    //         entry.equipmentId = boat2._id;
    //         entry.taskId = task._id;
    //         entry = await entry.save();

    //         let jsonEntry = {name:"Vidange d'huile"};
            
    //         // Act
    //         let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(400);
    //     });
    // });

    // describe('/DELETE/:equipmentId/:taskId/:entryId delete entry', () => {
    //     it('it should get a 200 http code as a result because the orphan entry was deleted successfully', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();

    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
    //         entry.equipmentId = boat._id;
    //         entry = await entry.save();

    //         // Act
    //         let res = await chai.request(app).delete('/api/entries/'+ boat._uiId.toString() + '/-/' + entry._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(200);
    //         res.body.should.have.property("entry");
    //         res.body.entry.should.be.a("object");
    //         res.body.entry.should.not.have.property("_id");
    //         res.body.entry.should.have.property("_uiId");
    //         res.body.entry._uiId.should.be.eql(entry._uiId.toString());
    //     });

    //     it('it should get a 200 http code as a result because the entry was deleted successfully', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();

    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
    //         task.equipmentId = boat._id;
    //         task = await task.save();

    //         let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
    //         entry.equipmentId = boat._id;
    //         entry.taskId = task._id;
    //         entry = await entry.save();

    //         // Act
    //         let res = await chai.request(app).delete('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(200);
    //         res.body.should.have.property("entry");
    //         res.body.entry.should.be.a("object");
    //         res.body.entry.should.not.have.property("_id");
    //         res.body.entry.should.have.property("_uiId");
    //         res.body.entry._uiId.should.be.eql(entry._uiId.toString());
    //     });

    //     it('it should get a 400 http code as a result because the entry does not exist', async () => {
    //         // Arrange
    //         let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
    //         user.setPassword("test");
    //         user = await user.save();

    //         let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
    //         boat.ownerId = user._id;
    //         boat = await  boat.save();

    //         let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
    //         task.equipmentId = boat._id;
    //         task = await task.save();

    //         let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
    //         entry.equipmentId = boat._id;
    //         entry.taskId = task._id;
            
    //         // Act
    //         let res = await chai.request(app).delete('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

    //         // Assert
    //         res.should.have.status(400);
    //     });
    // });
});