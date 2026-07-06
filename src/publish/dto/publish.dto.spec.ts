import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PublishDto } from './publish.dto';

async function validatePayload(payload: Record<string, unknown>) {
  const dto = plainToInstance(PublishDto, payload);
  const errors = await validate(dto);
  return { dto, errors };
}

describe('PublishDto', () => {
  it('accepts a non-empty string topic', async () => {
    const { dto, errors } = await validatePayload({ topic: 'orders' });

    expect(errors).toHaveLength(0);
    expect(dto.topic).toBe('orders');
  });

  it('trims and lowercases topic', async () => {
    const { dto, errors } = await validatePayload({
      topic: '  Orders.CREATED  ',
    });

    expect(errors).toHaveLength(0);
    expect(dto.topic).toBe('orders.created');
  });

  it('rejects an empty topic', async () => {
    const { errors } = await validatePayload({ topic: '' });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('rejects a whitespace-only topic', async () => {
    const { errors } = await validatePayload({ topic: '   ' });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('rejects a missing topic', async () => {
    const { errors } = await validatePayload({});

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('rejects a non-string topic', async () => {
    const { errors } = await validatePayload({ topic: 123 });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isString');
  });
});
