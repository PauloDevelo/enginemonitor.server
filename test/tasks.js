//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const app = require('../app');
const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');

const should = chai.should();

const Users = mongoose.model('Users');
const Boats = mongoose.model('Boats');
const Tasks = mongoose.model('Tasks');

chai.use(chaiHttp);

describe('Tasks', () => {
    afterEach(async () => {
        await Tasks.deleteMany(); 
        await Boats.deleteMany();  
        await Users.deleteMany();  
    });

    describe('/GET/:boatId tasks', () => {
        it('it should GET a 200 http code as a result because the task was return successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            let token = user.generateJWT();

            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat._id;

            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._id.toString()).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("tasks");
            res.body.tasks.should.be.a("array");
            res.body.tasks.length.should.be.eql(1);
            res.body.tasks[0].should.have.property("name");
        });

        it('it should GET a 400 http code as a result because the user does not exist', async () => {
            // Arrange
            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");
            let fakeUserId = fakeUser._id;
            let token = fakeUser.generateJWT();

            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat._id;

            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._id.toString()).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 400 http code as a result because the user is not the owner', async () => {
            // Arrange
            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");
            let fakeUserId = fakeUser._id;
            let token = fakeUser.generateJWT();
            fakeUser = await fakeUser.save();

            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat._id;

            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._id.toString()).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(401);
        });

        it('it should GET a 400 http code as a result because the boat does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._id.toString()).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(400);
        });
    });

    describe('/POST/:boatId new task', () => {
        it('it should GET a 200 http code as a result because the task was return successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            let token = user.generateJWT();

            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = {name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"};

            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._id.toString()).send({task: task}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("task");
            res.body.task.should.be.a("object");
            res.body.task.should.have.property("name");
            res.body.task.should.have.property("engineHours");
            res.body.task.should.have.property("month");
            res.body.task.should.have.property("description");
            res.body.task.name.should.be.eql("Vidange");
            res.body.task.engineHours.should.be.eql(200);
            res.body.task.month.should.be.eql(12);
            res.body.task.description.should.be.eql("Faire la vidange");
        });

        it('it should GET a 422 http code as a result because the task name was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            let token = user.generateJWT();

            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = { engineHours:200, month:12, description:"Faire la vidange" };

            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._id.toString()).send({task: task}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("name");
            res.body.errors.name.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the task engineHours was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            let token = user.generateJWT();

            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = { name:"Vidange", month:12, description:"Faire la vidange" };

            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._id.toString()).send({task: task}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("engineHours");
            res.body.errors.engineHours.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the task month was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            let token = user.generateJWT();

            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = { name:"Vidange", engineHours:200, description:"Faire la vidange" };

            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._id.toString()).send({task: task}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("month");
            res.body.errors.month.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the task description was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            let token = user.generateJWT();

            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = { name:"Vidange", engineHours:200, month:12};

            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._id.toString()).send({task: task}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("description");
            res.body.errors.description.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the task already exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            let token = user.generateJWT();
            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let jsonTask = {name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"};
            let task = new Tasks(jsonTask);
            task.boatId = boat._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._id.toString()).send({task: jsonTask}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("name");
            res.body.errors.name.should.be.eql("alreadyexisting");
        });
    });

    describe('/POST/:boatId/:taskId change a task', () => {
        it('it should get a 200 http code as a result because the task changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat._id;
            task = await task.save();

            let jsonTask = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._id.toString() + '/' + task._id.toString()).send({task: jsonTask}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("task");
            res.body.task.should.be.a("object");
            res.body.task.should.have.property("name");
            res.body.task.should.have.property("engineHours");
            res.body.task.should.have.property("month");
            res.body.task.should.have.property("description");

            res.body.task.name.should.be.eql("Vidange d'huile");
            res.body.task.engineHours.should.be.eql(200);
            res.body.task.month.should.be.eql(12);
            res.body.task.description.should.be.eql("Faire la vidange");
        });

        it('it should get a 200 http code as a result because the task changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat._id;
            task = await task.save();

            let jsonTask = {engineHours:300};
            
            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._id.toString() + '/' + task._id.toString()).send({task: jsonTask}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("task");
            res.body.task.should.be.a("object");
            res.body.task.should.have.property("name");
            res.body.task.should.have.property("engineHours");
            res.body.task.should.have.property("month");
            res.body.task.should.have.property("description");

            res.body.task.name.should.be.eql("Vidange");
            res.body.task.engineHours.should.be.eql(300);
            res.body.task.month.should.be.eql(12);
            res.body.task.description.should.be.eql("Faire la vidange");
        });

        it('it should get a 200 http code as a result because the task changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat._id;
            task = await task.save();

            let jsonTask = {month:24};
            
            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._id.toString() + '/' + task._id.toString()).send({task: jsonTask}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("task");
            res.body.task.should.be.a("object");
            res.body.task.should.have.property("name");
            res.body.task.should.have.property("engineHours");
            res.body.task.should.have.property("month");
            res.body.task.should.have.property("description");

            res.body.task.name.should.be.eql("Vidange");
            res.body.task.engineHours.should.be.eql(200);
            res.body.task.month.should.be.eql(24);
            res.body.task.description.should.be.eql("Faire la vidange");
        });

        it('it should get a 200 http code as a result because the task changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat._id;
            task = await task.save();

            let jsonTask = {description:"Bien Faire la vidange"};
            
            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._id.toString() + '/' + task._id.toString()).send({task: jsonTask}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("task");
            res.body.task.should.be.a("object");
            res.body.task.should.have.property("name");
            res.body.task.should.have.property("engineHours");
            res.body.task.should.have.property("month");
            res.body.task.should.have.property("description");

            res.body.task.name.should.be.eql("Vidange");
            res.body.task.engineHours.should.be.eql(200);
            res.body.task.month.should.be.eql(12);
            res.body.task.description.should.be.eql("Bien Faire la vidange");
        });

        it('it should get a 401 http code as a result because the task does not belong to the boat of the request', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let boat2 = new Boats({name: "Albatros", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat2.ownerId = userId;
            boat2 = await  boat2.save();

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat2._id;
            task = await task.save();

            let jsonTask = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._id.toString() + '/' + task._id.toString()).send({task: jsonTask}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(401);
        });

        it('it should get a 400 http code as a result because the task does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat._id;

            let jsonTask = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._id.toString() + '/' + task._id.toString()).send({task: jsonTask}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(400);
        });

        it('it should get a 422 http code as a result because the task already exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat._id;
            task = await task.save();

            let task2 = new Tasks({name:"Vidange d'huile", engineHours:200, month:12, description:"Faire la vidange"});
            task2.boatId = boat._id;
            task2 = await task2.save();

            let jsonTask = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._id.toString() + '/' + task._id.toString()).send({task: jsonTask}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("name");
            res.body.errors.name.should.be.eql("alreadyexisting");
        });
    });

    describe('/DELETE/:boatId/:taskId delete task', () => {
        it('it should get a 200 http code as a result because the task was deleted successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).delete('/api/tasks/'+ boat._id.toString() + '/' + task._id.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("task");
            res.body.task.should.be.a("object");
            res.body.task.should.have.property("_id");
            res.body.task._id.should.be.eql(task._id.toString());
        });

        it('it should get a 400 http code as a result because the task does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat._id;
            //task = await task.save();

            // Act
            let res = await chai.request(app).delete('/api/tasks/'+ boat._id.toString() + '/' + task._id.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(400);
        });

        it('it should get a 401 http code as a result because the task does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Boats({name: "Arbutus", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let boat2 = new Boats({name: "Albatros", engineBrand:"Nanni", engineModel:"N3.30", engineAge:1234, engineInstallation:"2018/01/20"});
            boat2.ownerId = user._id;
            boat2 = await  boat2.save();

            let task = new Tasks({name:"Vidange", engineHours:200, month:12, description:"Faire la vidange"});
            task.boatId = boat2._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).delete('/api/tasks/'+ boat._id.toString() + '/' + task._id.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(401);
        });
    });
});