import { ApiProperty } from '@nestjs/swagger';
import { GameModesEnum } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';
import { DM_MAX_ROWS, DM_MIN_ROWS } from '../../configs/constants';

export class DreamMineGamePreferences {
  @ApiProperty({ description: 'Initial Bet Amount', required: true })
  @IsNotEmpty({ message: 'Bet amount is must be specified.' })
  @IsNumber()
  @IsPositive({ message: 'Bet amount must be a positive value.' })
  betAmount: number;

  @ApiProperty({
    description: 'The difficulty of the game.',
    default: GameModesEnum.EASY,
    enum: GameModesEnum,
    enumName: 'GameModesEnum',
    required: true,
  })
  @IsEnum(GameModesEnum, {
    message: 'Available values are: EASY, MEDIUM, HARD',
  })
  mode: GameModesEnum;

  @ApiProperty({
    description: 'Number of rows that could be mined.',
    required: false,
    default: DM_MIN_ROWS,
  })
  @IsOptional()
  @IsNumber()
  @Min(DM_MIN_ROWS, {
    message: `Number of rows could not be smaller ${DM_MIN_ROWS}.`,
  })
  @Max(DM_MAX_ROWS, {
    message: `Number of rows could not be larger than ${DM_MAX_ROWS}.`,
  })
  rows?: number;
}
