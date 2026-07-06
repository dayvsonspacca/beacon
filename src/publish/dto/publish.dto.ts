import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { EventPayload } from '../../events/event-payload';
import { normalizeTopic } from '../../events/topics';

export class PublishDto implements EventPayload {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeTopic(value) : value,
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
