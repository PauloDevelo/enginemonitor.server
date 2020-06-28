export interface ITimeService {
  getUTCDateTime(): Date;
}

class TimeService implements ITimeService {
  // eslint-disable-next-line class-methods-use-this
  getUTCDateTime():Date {
    return new Date();
  }
}

const timeService: ITimeService = new TimeService();

export default timeService;
