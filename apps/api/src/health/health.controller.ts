import { Controller, Get, Inject, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get('health')
  async health(@Res() response: Response): Promise<void> {
    await this.write(response);
  }

  @Get('api/v1/health')
  async healthV1(@Res() response: Response): Promise<void> {
    await this.write(response);
  }

  private async write(response: Response): Promise<void> {
    const payload = await this.healthService.check();
    const status = payload.success ? 200 : 503;
    response.status(status).json(payload);
  }
}
