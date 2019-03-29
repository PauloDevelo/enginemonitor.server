if (process.env.NODE_ENV === undefined) {
    // tslint:disable-next-line:no-console
    console.log("Please, consider setting the environment variable NODE_ENV.");
    // tslint:disable-next-line:no-console
    console.log("As NODE_ENV is undefined, the value dev will be used.");
    process.env.NODE_ENV = "dev";
}

if (process.env.NODE_ENV === "production") {
    process.env.NODE_ENV = "prod";
}

if (process.env.NODE_ENV === "development") {
    process.env.NODE_ENV = "dev";
}

if (process.env.NODE_ENV !== "prod" &&
    process.env.NODE_ENV !== "test" &&
    process.env.NODE_ENV !== "dev") {
    // tslint:disable-next-line:no-console
    console.log("Please, consider setting the environment variable NODE_ENV with one of these values: test|dev|prod");
    // tslint:disable-next-line:no-console
    console.log("As NODE_ENV is not set correctly, the value dev will be used.");
    process.env.NODE_ENV = "dev";
}

// tslint:disable-next-line:no-console
console.log("process.env.NODE_ENV=" + process.env.NODE_ENV);

import config from "config";

export const isProd = process.env.NODE_ENV === "prod";
export const isDev = process.env.NODE_ENV === "dev";

export default config;
