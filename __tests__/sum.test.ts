import { sum } from '../src/js/sum';

test('adds 1 + 2 to equal 3', () => {
  const result: number = sum(1, 2);
  const expected: number = 3;

  expect(result).toBe(expected);
});
