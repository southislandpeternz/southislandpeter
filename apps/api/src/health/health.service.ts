import { Inject, Injectable, Logger } from '@nestjs/common';
import { fail, ok, type ApiResponse } from '@sp2036/shared';
import type { HealthCheckData } from '@sp2036/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async check(): Promise<ApiResponse<HealthCheckData>> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return ok({
        status: 'ok',
        service: 'sp2036-api',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      this.logger.error(
        'Health check database probe failed',
        error instanceof Error ? error.stack : undefined,
      );
      return fail('DATABASE_UNAVAILABLE', 'Database connection failed.');
    }
  }
}
