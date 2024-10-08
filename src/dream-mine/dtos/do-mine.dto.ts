import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { DM_COLUMNS_COUNT } from 'src/configs/constants';

export class DoMineDto {
  @ApiProperty({ description: 'The stone user has selected.', required: true })
  @IsNotEmpty({ message: 'You must specify which stone you are mining.' })
  @IsInt()
  @Min(1, {
    message: `choice must be an integer in [1, ${DM_COLUMNS_COUNT}] range.`,
  })
  @Max(DM_COLUMNS_COUNT, {
    message: `choice must be an integer in [1, ${DM_COLUMNS_COUNT}] range.`,
  })
  choice: number;
}
