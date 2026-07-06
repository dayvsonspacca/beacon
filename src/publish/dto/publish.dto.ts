import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class PublishDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  topic: string;
}
