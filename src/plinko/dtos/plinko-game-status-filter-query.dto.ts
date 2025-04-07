import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { GameStatusFilterQuery } from '../../games/dtos/game-status-filter.query';
import { GeneralPlinkoGameStatus } from '../types/general-plinko-status.type';
import { PlinkoGameStatus } from '@prisma/client';
import { ExtraGameStatusEnum } from '../../common/types/game.types';

const supportedGameStatusOptions = [
  ...Object.values(PlinkoGameStatus),
  ...Object.values(ExtraGameStatusEnum),
];
export class PlinkoGameStatusFilterQuery extends OmitType(
  GameStatusFilterQuery,
  ['status'],
) {
  @ApiProperty({
    description: 'Filter only games within special status.',
    required: false,
  })
  @IsOptional()
  @IsIn(supportedGameStatusOptions, {
    message:
      'Game status must be one of these options: ' +
      supportedGameStatusOptions.map((x) => `'${x}'`).join(', '),
  })
  status?: GeneralPlinkoGameStatus;
}
