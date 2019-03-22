//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const app = require('../app');
const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');

const should = chai.should();
const Users = mongoose.model('Users');
const Equipments = mongoose.model('Equipments');

chai.use(chaiHttp);

describe('Equipments', () => {
    afterEach(async () => {
        await Equipments.deleteMany();  
        await Users.deleteMany();        
    });

    describe('/GET equipments', () => {
        it('it should GET a 401 http code as a result because the request does not have the token', async () => {
            let res = await chai.request(app).get('/api/equipments');
            res.should.have.status(401);
            res.body.errors.message.should.be.eql("No authorization token was found");
            res.body.errors.error.name.should.be.eql("UnauthorizedError");
            res.body.errors.error.code.should.be.eql("credentials_required");
            res.body.errors.error.status.should.be.eql(401);
        });

        it('it should get a 400 http code as a result because the token is invalid', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let res = await chai.request(app).get('/api/equipments').set("Authorization", "Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdWwudG9ycnVlbGxhQGdtYWlsLmNvbSIsImlkIjoiNWMyNWJmYmY1NDE4ZTM0ZGJjN2I5ZTkzIiwiZXhwIjoxNTUxMTYxNzkxLCJpYXQiOjE1NDU5Nzc3OTF9.uBge-2VvmJiweF-jCPOcLonn0ewBlNjy9wm6mFdSVQo");
            res.should.have.status(400);
            res.body.should.have.property("errors");
            res.body.errors.should.have.property("id");
            res.body.errors.id.should.be.eql("isinvalid");
        });

        it('it should GET a 200 http code as a result and a equipment because we set the correct token', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let equipment = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            equipment.ownerId = user._id;

            equipment = await equipment.save();
            let res = await chai.request(app).get('/api/equipments').set("Authorization", "Token " + user.generateJWT());
               
            res.should.have.status(200);
            res.body.should.have.property("equipments");
            res.body.equipments.should.be.a("array");
            res.body.equipments.length.should.be.eql(1);
            res.body.equipments[0].should.have.property("name");
            res.body.equipments[0].name.should.be.eql("Arbutus");
            res.body.equipments[0].should.have.property("brand");
            res.body.equipments[0].brand.should.be.eql("Nanni");
            res.body.equipments[0].should.have.property("model");
            res.body.equipments[0].model.should.be.eql("N3.30");
            res.body.equipments[0].should.have.property("age");
            res.body.equipments[0].age.should.be.eql(1234);
        });
    });

    describe('POST equipments', () => {
        it('it should get a 401 http code as a result because the request does not have the token', async () => {
            let res = await chai.request(app).post('/api/equipments');
            
            res.should.have.status(401);
            res.body.errors.message.should.be.eql("No authorization token was found");
            res.body.errors.error.name.should.be.eql("UnauthorizedError");
            res.body.errors.error.code.should.be.eql("credentials_required");
            res.body.errors.error.status.should.be.eql(401);
        });

        it('it should get a 400 http code as a result because the token is invalid', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
                
            let equipment = { name: "Arbutus", brand: "Nanni", model: "N3.30", age: 1234, installation: "2018-01-09T23:00:00.000Z" };

            let res = await chai.request(app).post('/api/equipments').send({equipment:equipment}).set("Authorization", "Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdWwudG9ycnVlbGxhQGdtYWlsLmNvbSIsImlkIjoiNWMyNWJmYmY1NDE4ZTM0ZGJjN2I5ZTkzIiwiZXhwIjoxNTUxMTYxNzkxLCJpYXQiOjE1NDU5Nzc3OTF9.uBge-2VvmJiweF-jCPOcLonn0ewBlNjy9wm6mFdSVQo");
            
            res.should.have.status(400);
            res.body.should.have.property("errors");
            res.body.errors.should.have.property("id");
            res.body.errors.id.should.be.eql("isinvalid");
        });

        it('it should get a 200 http code as a result because the equipment was successfully created', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");

            user = await user.save();
            let equipment = { name: "Arbutus", brand: "Nanni", model: "N3.30", age: 1234, installation: "2018-01-09T23:00:00.000Z" };

            let res = await chai.request(app).post('/api/equipments').send({equipment:equipment}).set("Authorization", "Token " + user.generateJWT());
            
            res.should.have.status(200);
            res.body.should.have.property("equipment");
            res.body.equipment.should.have.property("name");
            res.body.equipment.should.have.property("brand");
            res.body.equipment.should.have.property("model");
            res.body.equipment.should.have.property("age");
            res.body.equipment.should.have.property("installation");
            res.body.equipment.should.have.property("_id");
            res.body.equipment.should.have.property("ownerId");

            res.body.equipment.name.should.be.eql("Arbutus");
            res.body.equipment.brand.should.be.eql("Nanni");
            res.body.equipment.model.should.be.eql("N3.30");
            res.body.equipment.age.should.be.eql(1234);
            res.body.equipment.installation.should.be.eql("2018-01-09T23:00:00.000Z");
            res.body.equipment.ownerId.should.be.eql(user._id.toString());  
        });
    })

    describe('POST/:equipmentId equipment', () => {
        it('it should get a 200 http code as a result because the equipment age was successfully modified', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await boat.save();
            let res = await chai.request(app).post('/api/equipments/' + boat._id).send({equipment:{age:1235}}).set("Authorization", "Token " + user.generateJWT());
            
            res.should.have.status(200);
            res.body.should.have.property("equipment");
            res.body.equipment.should.be.a("object");
            res.body.equipment.should.have.property("age");
            res.body.equipment.age.should.be.eql(1235);
        });

        it('it should get a 200 http code as a result because the equipment name was successfully modified', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await boat.save();
            let res = await chai.request(app).post('/api/equipments/' + boat._id).send({equipment:{name:'Arbatros'}}).set("Authorization", "Token " + token);
            
            res.should.have.status(200);
            res.body.should.have.property("equipment");
            res.body.equipment.should.be.a("object");
            res.body.equipment.should.have.property("name");
            res.body.equipment.name.should.be.eql('Arbatros');
        });

        it('it should get a 200 http code as a result because the equipment brand was successfully modified', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await boat.save();

            let res = await chai.request(app).post('/api/equipments/' + boat._id).send({equipment:{brand:'Nanni Diesel'}}).set("Authorization", "Token " + user.generateJWT());
            
            res.should.have.status(200);
            res.body.should.have.property("equipment");
            res.body.equipment.should.be.a("object");
            res.body.equipment.should.have.property("brand");
            res.body.equipment.brand.should.be.eql('Nanni Diesel');
        });

        it('it should get a 200 http code as a result because the equipment model was successfully modified', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await boat.save();

            let res = await chai.request(app).post('/api/equipments/' + boat._id).send({equipment:{model:'3.30'}}).set("Authorization", "Token " + user.generateJWT());
            res.should.have.status(200);
            res.body.should.have.property("equipment");
            res.body.equipment.should.be.a("object");
            res.body.equipment.should.have.property("model");
            res.body.equipment.model.should.be.eql('3.30');
        });
    });

    describe('DELETE/:equipmentId equipment', () => {
        it('it should get a 200 http code as a result because the equipment was successfully deleted', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await boat.save();

            let res = await chai.request(app).delete('/api/equipments/' + boat._id).set("Authorization", "Token " + user.generateJWT());
            res.should.have.status(200);
            res.body.should.have.property("equipment");
            res.body.equipment.should.be.a("object");

            res = await chai.request(app).get('/api/equipments').set("Authorization", "Token " + user.generateJWT());
            res.should.have.status(200);
            res.body.should.have.property("equipments");
            res.body.equipments.should.be.a("array");
            res.body.equipments.length.should.be.eql(0);
        });

        it('it should get a 400 http code as a result because the equipment does not exist', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let res = await chai.request(app).delete('/api/equipments/5c27912a9bc7e61fdcd2e82c').set("Authorization", "Token " + user.generateJWT())
            res.should.have.status(400);
        });

        it('it should get a 401 http code as a result because the equipment requested is not own by the user', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = "5c27912a9bc7e61fdcd2e82c";
            boat = await boat.save();

            let res = await chai.request(app).delete('/api/equipments/' + boat._id).set("Authorization", "Token " + user.generateJWT());
            res.should.have.status(401);
        });
    });
});