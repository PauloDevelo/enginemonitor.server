import sinon from 'sinon';
import logger from '../src/utils/logger';
import { Logger } from 'winston';

const ignoredErrorMessages:string[] = [
];

export const ignoredDebugMessages:string[] = [
];

const mockLeveledLogMethod = (realConsoleMethod: (message: object)=> Logger, ignoredMessages: string[]) => {
    return (message: object): Logger => {
        const containsIgnoredMessage = ignoredMessages.some((ignoredMessage) => message.toString().includes(ignoredMessage));

        if (!containsIgnoredMessage) {
            return realConsoleMethod(message);
        }
    };
};

let stubErrorLogger = undefined;
let stubDebugLogger = undefined;

export const mockLogger = () => {
    var errorMocked = mockLeveledLogMethod(logger.error, ignoredErrorMessages);
    stubErrorLogger = sinon.stub(logger, "error").callsFake(errorMocked);

    var debugMocked = mockLeveledLogMethod(logger.debug, ignoredDebugMessages);
    stubDebugLogger = sinon.stub(logger, "debug").callsFake(debugMocked);
}

export const restoreLogger = () => {
    stubErrorLogger.restore();
    stubDebugLogger.restore();
    ignoredErrorMessages.length = 0;
    ignoredDebugMessages.length = 0;
}

export default ignoredErrorMessages;
