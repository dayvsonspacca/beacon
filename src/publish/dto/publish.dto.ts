import { Transform } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { normalizeTopic } from '../../events/topics';

export class PublishDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeTopic(value) : value,
  )
  topic: string;

  @IsObject()
  data: Record<string, any>;
}
