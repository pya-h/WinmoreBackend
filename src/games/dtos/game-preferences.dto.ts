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

export class CommonGamePreferencesDto {
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
    message:
      'Available token values are: ' + Object.values(TokensEnum).join(', '),
  })
  token: TokensEnum;

  @ApiProperty({
    description: 'Id of the chain bet resources are in.',
    required: true,
  })
  @IsNotEmpty({
    message: 'You must specify from which chain you want to put money',
  })
  @IsInt()
  @IsPositive({ message: 'chainId must be positive.' })
  chainId?: number;

  @ApiProperty({
    description: 'The difficulty of the game.',
    default: GameModesEnum.EASY,
    enum: GameModesEnum,
    enumName: 'GameModesEnum',
    required: true,
  })
  @IsEnum(GameModesEnum, {
    message:
      'Available mode values are: ' + Object.values(GameModesEnum).join(', '),
  })
  mode: GameModesEnum;

  @ApiProperty({
    description: 'Number of rows.',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @IsPositive({ message: 'Number of rows must be a positive integer' })
  rows?: number;
}
