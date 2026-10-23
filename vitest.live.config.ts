import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['tests/**/*.live.ts'],fileParallelism:false,testTimeout:60000,hookTimeout:30000}});
