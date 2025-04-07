import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { ExtraGameStatusEnum, GeneralGameStatus } from '../types/game.types';
import { GameStatusEnum } from '@prisma/client';
import { SortModeEnum } from '../types/sort-enum.dto';
import { PaginationOptionsDto } from 'src/common/dtos/pagination-options.dto';
import { SortOrderEnum } from '../../common/types/sort-orders.enum';

const supportedGameStatusOptions = [
  ...Object.values(GameStatusEnum),
  ...Object.values(ExtraGameStatusEnum),
];
export class GameStatusFilterQuery extends PaginationOptionsDto {
  @ApiProperty({
    description: 'Filter only games within special status.',
    required: false,
  })
  @IsOptional()
  @IsIn(supportedGameStatusOptions, {
    message:
      'Game status must be one of these options: ' +
      supportedGameStatusOptions.join(', '),
  })
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
