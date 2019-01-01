//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const app = require('../app');
const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');

const should = chai.should();
const Users = mongoose.model('Users');
const Boats = mongoose.model('Boats');

chai.use(chaiHttp);

describe('Boats', () => {
    afterEach(async () => {
        await Boats.deleteMany();  
        await Users.deleteMany();        
    });

    describe('/GET boats', () => {
        it('it should GET a 401 http code as a result because the request does not have the token', async () => {
            let res = await chai.request(app).get('/api/boats');
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
            
            let res = await chai.request(app).get('/api/boats').set("Authorization", "Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdWwudG9ycnVlbGxhQGdtYWlsLmNvbSIsImlkIjoiNWMyNWJmYmY1NDE4ZTM0ZGJjN2I5ZTkzIiwiZXhwIjoxNTUxMTYxNzkxLCJpYXQiOjE1NDU5Nzc3OTF9.uBge-2VvmJiweF-jCPOcLonn0ewBlNjy9wm6mFdSVQo");
            res.should.have.status(400);
            res.body.should.have.property("errors");
            res.body.errors.should.have.property("id");
            res.body.errors.id.should.be.eql("isinvalid");
        });

        it('it should GET a 200 http code as a result and a boat because we set the correct token', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = user._id;

            boat = await boat.save();
            let res = await chai.request(app).get('/api/boats').set("Authorization", "Token " + user.generateJWT());
               
            res.should.have.status(200);
            res.body.should.have.property("boats");
            res.body.boats.should.be.a("array");
            res.body.boats.length.should.be.eql(1);
            res.body.boats[0].should.have.property("name");
            res.body.boats[0].name.should.be.eql("Arbutus");
            res.body.boats[0].should.have.property("engineBrand");
            res.body.boats[0].engineBrand.should.be.eql("Nanni");
            res.body.boats[0].should.have.property("engineModel");
            res.body.boats[0].engineModel.should.be.eql("N3.30");
            res.body.boats[0].should.have.property("engineAge");
            res.body.boats[0].engineAge.should.be.eql(1234);
        });
    });

    describe('POST boats', () => {
        it('it should get a 401 http code as a result because the request does not have the token', async () => {
            let res = await chai.request(app).post('/api/boats');
            
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
                
            let boat = { name: "Arbutus", engineBrand: "Nanni", engineModel: "N3.30", engineAge: 1234, engineInstallation: "2018-01-09T23:00:00.000Z" };

            let res = await chai.request(app).post('/api/boats').send({boat:boat}).set("Authorization", "Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdWwudG9ycnVlbGxhQGdtYWlsLmNvbSIsImlkIjoiNWMyNWJmYmY1NDE4ZTM0ZGJjN2I5ZTkzIiwiZXhwIjoxNTUxMTYxNzkxLCJpYXQiOjE1NDU5Nzc3OTF9.uBge-2VvmJiweF-jCPOcLonn0ewBlNjy9wm6mFdSVQo");
            
            res.should.have.status(400);
            res.body.should.have.property("errors");
            res.body.errors.should.have.property("id");
            res.body.errors.id.should.be.eql("isinvalid");
        });

        it('it should get a 200 http code as a result because the boat was successfully created', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");

            user = await user.save();
            let boat = { name: "Arbutus", engineBrand: "Nanni", engineModel: "N3.30", engineAge: 1234, engineInstallation: "2018-01-09T23:00:00.000Z" };

            let res = await chai.request(app).post('/api/boats').send({boat:boat}).set("Authorization", "Token " + user.generateJWT());
            
            res.should.have.status(200);
            res.body.should.have.property("boat");
            res.body.boat.should.have.property("name");
            res.body.boat.should.have.property("engineBrand");
            res.body.boat.should.have.property("engineModel");
            res.body.boat.should.have.property("engineAge");
            res.body.boat.should.have.property("engineInstallation");
            res.body.boat.should.have.property("_id");
            res.body.boat.should.have.property("ownerId");

            res.body.boat.name.should.be.eql("Arbutus");
            res.body.boat.engineBrand.should.be.eql("Nanni");
            res.body.boat.engineModel.should.be.eql("N3.30");
            res.body.boat.engineAge.should.be.eql(1234);
            res.body.boat.engineInstallation.should.be.eql("2018-01-09T23:00:00.000Z");
            res.body.boat.ownerId.should.be.eql(user._id.toString());  
        });
    })

    describe('POST/:boatId boat', () => {
        it('it should get a 200 http code as a result because the engine age was successfully modified', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await boat.save();
            let res = await chai.request(app).post('/api/boats/' + boat._id).send({boat:{engineAge:1235}}).set("Authorization", "Token " + user.generateJWT());
            
            res.should.have.status(200);
            res.body.should.have.property("boat");
            res.body.boat.should.be.a("object");
            res.body.boat.should.have.property("engineAge");
            res.body.boat.engineAge.should.be.eql(1235);
        });

        it('it should get a 200 http code as a result because the boat name was successfully modified', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await boat.save();
            let res = await chai.request(app).post('/api/boats/' + boat._id).send({boat:{name:'Arbatros'}}).set("Authorization", "Token " + token);
            
            res.should.have.status(200);
            res.body.should.have.property("boat");
            res.body.boat.should.be.a("object");
            res.body.boat.should.have.property("name");
            res.body.boat.name.should.be.eql('Arbatros');
        });

        it('it should get a 200 http code as a result because the engine brand was successfully modified', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await boat.save();

            let res = await chai.request(app).post('/api/boats/' + boat._id).send({boat:{engineBrand:'Nanni Diesel'}}).set("Authorization", "Token " + user.generateJWT());
            
            res.should.have.status(200);
            res.body.should.have.property("boat");
            res.body.boat.should.be.a("object");
            res.body.boat.should.have.property("engineBrand");
            res.body.boat.engineBrand.should.be.eql('Nanni Diesel');
        });

        it('it should get a 200 http code as a result because the engine model was successfully modified', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await boat.save();

            let res = await chai.request(app).post('/api/boats/' + boat._id).send({boat:{engineModel:'3.30'}}).set("Authorization", "Token " + user.generateJWT());
            res.should.have.status(200);
            res.body.should.have.property("boat");
            res.body.boat.should.be.a("object");
            res.body.boat.should.have.property("engineModel");
            res.body.boat.engineModel.should.be.eql('3.30');
        });
    });

    describe('DELETE/:boatId boat', () => {
        it('it should get a 200 http code as a result because the engine was successfully deleted', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await boat.save();

            let res = await chai.request(app).delete('/api/boats/' + boat._id).set("Authorization", "Token " + user.generateJWT());
            res.should.have.status(200);
            res.body.should.have.property("boat");
            res.body.boat.should.be.a("object");

            res = await chai.request(app).get('/api/boats').set("Authorization", "Token " + user.generateJWT());
            res.should.have.status(200);
            res.body.should.have.property("boats");
            res.body.boats.should.be.a("array");
            res.body.boats.length.should.be.eql(0);
        });

        it('it should get a 400 http code as a result because the engine does not exist', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let res = await chai.request(app).delete('/api/boats/5c27912a9bc7e61fdcd2e82c').set("Authorization", "Token " + user.generateJWT())
            res.should.have.status(400);
        });

        it('it should get a 401 http code as a result because the engine requested is not own by the user', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = "5c27912a9bc7e61fdcd2e82c";
            boat = await boat.save();

            let res = await chai.request(app).delete('/api/boats/' + boat._id).set("Authorization", "Token " + user.generateJWT());
            res.should.have.status(401);
        });
    });
});