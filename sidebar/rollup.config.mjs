import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import dts from "rollup-plugin-dts";
import postcss from "rollup-plugin-postcss";

export default [
  // CSS 独立构建
  {
    input: "src/styles.css",
    output: {
      file: "dist/styles.css",
      format: "esm",
    },
    plugins: [
      postcss({
        extract: true,
        minimize: true,
      }),
    ],
  },
  // 主构建
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/cjs/index.js",
        format: "cjs",
        sourcemap: true,
      },
      {
        file: "dist/esm/index.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      terser(),
    ],
    external: [
      "react",
      "react-dom",
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-popover",
      "next/navigation",
    ],
  },
  // nextjs-adapter 构建
  {
    input: "src/nextjs-adapter/index.ts",
    output: [
      {
        file: "dist/cjs/nextjs-adapter/index.js",
        format: "cjs",
        sourcemap: true,
      },
      {
        file: "dist/esm/nextjs-adapter/index.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      terser(),
    ],
    external: ["react", "react-dom", "next/navigation"],
  },
  // 类型定义 - 主入口
  {
    input: "src/index.ts",
    output: {
      file: "dist/types/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
  // 类型定义 - nextjs-adapter
  {
    input: "src/nextjs-adapter/index.ts",
    output: {
      file: "dist/types/nextjs-adapter/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
];
