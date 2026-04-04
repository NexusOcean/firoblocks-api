import { Injectable } from '@nestjs/common';
import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';

const isProd = process.env.NODE_ENV === 'production';
const cpu = isProd ? availableParallelism() : 1;

@Injectable()
export class AppService {
  healthCheck() {
    const now = new Date();
    const uptimeSeconds = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    return {
      status: 'ok!',
      uptime: `${hours}h ${minutes}m ${seconds}s`,
      timestamp: now.toLocaleTimeString([], {
        hour12: true,
      }),
    };
  }

  static start(bootstrap: () => Promise<void>): void {
    if (cluster.isPrimary) {
      console.log(`Process: ${process.pid}`);

      for (let i = 0; i < cpu; i++) {
        cluster.fork();
      }

      console.log(`Instances: ${cpu}`);

      cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
        cluster.fork();
      });
    } else {
      void bootstrap();
    }
  }
}
