export const isDev = (): boolean => {
  if (typeof globalThis === 'undefined') {
    return false;
  }
  const env = (globalThis as any).process?.env;
  if (!env) {
    return false;
  }
  return env.NODE_ENV !== 'production';
};
