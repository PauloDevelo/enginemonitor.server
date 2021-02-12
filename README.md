This project is the back end side for the Equipment maintenance project.<br>
It runs using Node.js. I currently use Node 12.16.1<br>
The database is MongoDB. I currently use Mongo 4.0.10<br>
This project is coded using TypeScript + ESLint<br>
Unit tests are coded using Mocha and Chai<br>
Continuous Integration ![integration environment for github](https://github.com/PauloDevelo/enginemonitor.server/workflows/CI/badge.svg?branch=integration)<br>
<br>
## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the server.<br>
You might need to `npm run instal` first.

### `npm test`

Launches all the unit tests.<br>
The unit tests use an instances of MongoDB. Make sure to configure correctly the config/test.json file.<br>
The test coverage is regenerated each time. You can check coverage/lcov-report/index.html to see the result.<br>

### `npm reportCoverage`
Generate the coverage report. Check coverage/lcov-report/index.html to see the result.

### `npm run build`

It will first clean the dist directory.<br>
Then, it will lint the src folder.<br>
And finally, the TypeScript compiler will run and generate all the javascript files into the dist folder.<br>
