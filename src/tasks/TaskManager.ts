import cron, { ScheduledTask } from "node-cron";

import config, {isDev, isProd} from "../utils/configUtils";
import logger from "../utils/logger";

export interface ITask {action: () => void; cronTabConfig?: string; }

class TaskManager {
  private readonly tasks: ITask[];
  private readonly jobs: ScheduledTask[] = [];

  constructor(tasks: ITask[]) {
      this.tasks = tasks;
  }

  public stop() {
    this.jobs.forEach((job) => {
      job.stop();
    });
  }

  public start() {
    this.tasks.forEach((task) => {
      logger.debug(cron.validate(task.cronTabConfig));

      const options = {
        scheduled: true,
        timezone: "Europe/Paris"
      };

      const job = cron.schedule(task.cronTabConfig, task.action, options);
      job.start();

      this.jobs.push(job);
    });
  }
}

export default TaskManager;
