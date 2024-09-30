import { ApiProperty } from '@nestjs/swagger';
import { GameModesEnum } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class DreamMineGamePreferencesDto {
  @ApiProperty({ description: 'Initial Bet Amount', required: true })
  @IsNotEmpty({ message: 'Bet amount must be specified.' })
  @IsNumber()
  @IsPositive({ message: 'Bet amount must be a positive number.' })
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
  })
  @IsOptional()
  @IsInt()
  @IsPositive({ message: 'Number of rows must be a positive integer' })
  rows?: number;
}
