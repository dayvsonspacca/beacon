import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class PublishDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  topic: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsObject()
  data: Record<string, any>;

  @IsBoolean()
  persist: boolean = false;
}
