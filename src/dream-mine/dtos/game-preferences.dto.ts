import { ApiProperty } from '@nestjs/swagger';
import { GameModesEnum, TokensEnum } from '@prisma/client';
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
    description: 'The token which user is betting with.',
    default: TokensEnum.USDT,
    enum: TokensEnum,
    enumName: 'TokensEnum',
    required: true,
  })
  @IsEnum(TokensEnum, {
    message: 'Available values are: USDC, USDT',
  })
  token: TokensEnum;

  @ApiProperty({
    description: 'Id of the chain bet resources are in.',
    required: true,
  })
  @IsOptional()
  @IsInt()
  @IsPositive({ message: 'chainId must be a positive integer.' })
  chainId?: number;

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
