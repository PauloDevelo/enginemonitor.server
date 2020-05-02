export function sleep(ms: number) {
  return new Promise((resolve: () => void) => setTimeout(resolve, ms));
}
