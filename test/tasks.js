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
    beforeEach((done) => {
        Tasks.deleteMany({}, (err) => {   
        }); 
        Boats.deleteMany({}, (err) => {           
        });  
        Users.deleteMany({}, (err) => { 
            done();           
        });        
    });
});