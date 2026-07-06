export function normalizeTopic(topic: string): string {
  return topic.trim().toLowerCase();
}

export function matchesTopic(topic: string, pattern: string): boolean {
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
  return new RegExp(`^${regex}$`).test(topic);
}
