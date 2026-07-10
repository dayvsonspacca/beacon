import { Transform } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { Topic } from '../../../core/topic';

export class PublishDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? Topic.of(value).value : value,
  )
  topic: string;

  @IsObject()
  data: Record<string, any>;
}
