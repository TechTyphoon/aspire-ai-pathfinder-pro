/// <reference types="https://deno.land/x/types/index.d.ts" />

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};
