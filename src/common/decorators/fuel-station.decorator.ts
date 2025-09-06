import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FuelStation } from '../../fuel-stations/entities/fuel-station.entity';

export const CurrentFuelStation = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): FuelStation => {
    const request = ctx.switchToHttp().getRequest();
    return request.fuelStation;
  },
);