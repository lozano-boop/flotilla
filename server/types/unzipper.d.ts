declare module 'unzipper' {
  export const Open: {
    file(path: string): Promise<{ files: Array<{ path: string; buffer(): Promise<Buffer> }> }>;
  };
}
