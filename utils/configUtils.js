if (process.env.NODE_ENV === undefined){
    console.log("Please, consider setting the environment variable NODE_ENV. As NODE_ENV is undefined, the value dev will be used.");
    process.env.NODE_ENV = "dev";
}

if (process.env.NODE_ENV === "production"){
    process.env.NODE_ENV = 'prod';
}

if (process.env.NODE_ENV === "development"){
    process.env.NODE_ENV = 'dev';
}

if (process.env.NODE_ENV !== "prod" &&
    process.env.NODE_ENV !== "test" &&
    process.env.NODE_ENV !== "dev"){
    console.log("Please, consider setting the environment variable NODE_ENV with one of these values: test, dev or prod. As NODE_ENV is not set correctly, the value dev will be used.");
    process.env.NODE_ENV = "dev";
}

console.log('process.env.NODE_ENV=' + process.env.NODE_ENV);

let config = require('config');

//Configure isProduction variable
config.isProduction = process.env.NODE_ENV === 'prod';
config.isDev = process.env.NODE_ENV === 'dev';

module.exports = config;