import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { Job, JobsRepository } from '../storage/jobs.repository';

const POLL_INTERVAL_MS = 500;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_SECONDS = 5;

@Injectable()
export class QueueWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueWorker.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly jobs: JobsRepository,
    private readonly events: EventsService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => this.drain(), POLL_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  drain(): void {
    let job: Job | undefined;
    while ((job = this.jobs.claimNext())) {
      try {
        this.process(job);
        this.jobs.markDone(job.id);
      } catch (err) {
        if (job.attempts >= MAX_ATTEMPTS) {
          this.jobs.markFailed(job.id);
          this.logger.error(
            `job ${job.id} failed permanently after ${job.attempts} attempts`,
            err instanceof Error ? err.stack : String(err),
          );
        } else {
          const delay = RETRY_DELAY_SECONDS * job.attempts;
          this.jobs.requeue(job.id, delay);
          this.logger.warn(
            `job ${job.id} failed (attempt ${job.attempts}/${MAX_ATTEMPTS}), retrying in ${delay}s`,
          );
        }
      }
    }
  }

  private process(job: Job): void {
    this.events.emit({ eventId: job.id, ...job.payload });
    this.logger.log(`delivered ${job.id} (topic=${job.topic})`);
  }
}
