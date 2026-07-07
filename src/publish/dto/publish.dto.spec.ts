import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PublishDto } from './publish.dto';

const validPayload = {
  topic: 'orders',
  data: { id: 1 },
};

async function validatePayload(payload: Record<string, unknown>) {
  const dto = plainToInstance(PublishDto, payload);
  const errors = await validate(dto);
  return { dto, errors };
}

function constraintsOf(
  errors: Awaited<ReturnType<typeof validate>>,
  property: string,
) {
  return errors.find((e) => e.property === property)?.constraints;
}

describe('PublishDto', () => {
  it('accepts a valid payload', async () => {
    const { dto, errors } = await validatePayload(validPayload);

    expect(errors).toHaveLength(0);
    expect(dto.topic).toBe('orders');
    expect(dto.data).toEqual({ id: 1 });
  });

  describe('topic', () => {
    it('trims and lowercases', async () => {
      const { dto, errors } = await validatePayload({
        ...validPayload,
        topic: '  Orders.CREATED  ',
      });

      expect(errors).toHaveLength(0);
      expect(dto.topic).toBe('orders.created');
    });

    it('rejects empty or whitespace-only values', async () => {
      for (const topic of ['', '   ']) {
        const { errors } = await validatePayload({ ...validPayload, topic });
        expect(constraintsOf(errors, 'topic')).toHaveProperty('isNotEmpty');
      }
    });

    it('rejects missing value', async () => {
      const { topic: _topic, ...payload } = validPayload;
      const { errors } = await validatePayload(payload);

      expect(constraintsOf(errors, 'topic')).toHaveProperty('isNotEmpty');
      expect(constraintsOf(errors, 'topic')).toHaveProperty('isString');
    });

    it('rejects non-string value', async () => {
      const { errors } = await validatePayload({ ...validPayload, topic: 123 });

      expect(constraintsOf(errors, 'topic')).toHaveProperty('isString');
    });
  });

  describe('data', () => {
    it('accepts any object shape', async () => {
      const { dto, errors } = await validatePayload({
        ...validPayload,
        data: { nested: { deep: true }, list: [1, 2] },
      });

      expect(errors).toHaveLength(0);
      expect(dto.data).toEqual({ nested: { deep: true }, list: [1, 2] });
    });

    it('rejects missing value', async () => {
      const { data: _data, ...payload } = validPayload;
      const { errors } = await validatePayload(payload);

      expect(constraintsOf(errors, 'data')).toHaveProperty('isObject');
    });

    it('rejects non-object values', async () => {
      for (const data of ['text', 123, [1, 2], null]) {
        const { errors } = await validatePayload({ ...validPayload, data });
        expect(constraintsOf(errors, 'data')).toHaveProperty('isObject');
      }
    });
  });
});
