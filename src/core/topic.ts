export class Topic {
  private constructor(readonly value: string) {}

  static of(raw: string): Topic {
    return new Topic(raw.trim().toLowerCase());
  }

  matches(pattern: string): boolean {
    if (pattern === '**') {
      return true;
    }
    const regex = pattern
      .split('.')
      .map((segment) => {
        if (segment === '**') return '.*';
        if (segment === '*') return '[^.]+';
        return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('\\.');
    return new RegExp(`^${regex}$`).test(this.value);
  }

  toString(): string {
    return this.value;
  }
}
