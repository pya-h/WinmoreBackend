import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  ExtraGameStatusEnum,
  GeneralGameStatus,
} from '../../common/types/game.types';
import { GameStatusEnum } from '@prisma/client';

export class GameStatusFilterQuery {
  @ApiProperty({
    description: 'Filter only games within special status.',
    required: false,
  })
  @IsOptional()
  @IsIn([
    ...Object.values(GameStatusEnum),
    ...Object.values(ExtraGameStatusEnum),
  ])
  status?: GeneralGameStatus;
}
