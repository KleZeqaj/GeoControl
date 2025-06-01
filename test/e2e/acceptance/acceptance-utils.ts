export function expectOptionalEmptyArray(value: any) {
  expect(
    value === undefined || (Array.isArray(value) && value.length === 0)
  ).toBe(true);
}
