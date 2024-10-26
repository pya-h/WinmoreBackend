import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import {
  ExtraGameStatusEnum,
  GeneralGameStatus,
} from '../../common/types/game.types';
import { GameStatusEnum } from '@prisma/client';
import { SortModeEnum, SortOrderEnum } from '../types/sort-enum.dto';
import { PaginationOptionsDto } from 'src/common/dtos/pagination-options.dto';

export class GameStatusFilterQuery extends PaginationOptionsDto {
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

  @ApiProperty({
    description: 'Sort type of game lists.',
    required: false,
  })
  @IsOptional()
  @IsEnum(SortModeEnum, {
    message: 'Valid sort modes are: ' + Object.values(SortModeEnum).join(', '),
  })
  sort?: SortModeEnum;

  @ApiProperty({
    description: 'Sort order',
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrderEnum, {
    message:
      'Valid sort orders are: ' + Object.values(SortOrderEnum).join(', '),
  })
  order?: SortOrderEnum;
}
