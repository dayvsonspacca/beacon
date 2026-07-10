export class Source {
  private constructor(readonly id: string) {}

  static of(raw: string): Source {
    const id = raw.trim();
    if (id === '') {
      throw new Error('source id must be non-empty');
    }
    return new Source(id);
  }

  equals(other: Source): boolean {
    return this.id === other.id;
  }

  toString(): string {
    return this.id;
  }
}
