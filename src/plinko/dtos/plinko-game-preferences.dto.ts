import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { CommonGamePreferencesDto } from 'src/games/dtos/game-preferences.dto';

export class PlinkoGamePreferences extends CommonGamePreferencesDto {
  @ApiProperty({
    description: 'Number of balls dropping from above.',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @IsPositive({
    message: 'Number of balls dropping; Bet amount will be multiplied by this!',
  })
  numberOfBalls?: number;
}
