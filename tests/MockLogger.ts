/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
import sinon from 'sinon';
import { Logger } from 'winston';
import logger from '../src/utils/logger';

const ignoredErrorMessages:string[] = [
];

export const ignoredDebugMessages:string[] = [
];

// eslint-disable-next-line consistent-return
const mockLeveledLogMethod = (realConsoleMethod: (message: object)=> Logger, ignoredMessages: string[]) => (message: object): Logger => {
  const containsIgnoredMessage = ignoredMessages.some((ignoredMessage) => message.toString().includes(ignoredMessage));

  if (!containsIgnoredMessage) {
    return realConsoleMethod(message);
  }
};

let stubErrorLogger;
let stubDebugLogger;

export const mockLogger = () => {
  const errorMocked = mockLeveledLogMethod(logger.error, ignoredErrorMessages);
  stubErrorLogger = sinon.stub(logger, 'error').callsFake(errorMocked);

  const debugMocked = mockLeveledLogMethod(logger.debug, ignoredDebugMessages);
  stubDebugLogger = sinon.stub(logger, 'debug').callsFake(debugMocked);
};

export const restoreLogger = () => {
  stubErrorLogger.restore();
  stubDebugLogger.restore();
  ignoredErrorMessages.length = 0;
  ignoredDebugMessages.length = 0;
};

export default ignoredErrorMessages;
