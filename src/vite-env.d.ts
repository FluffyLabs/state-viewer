/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.svg?react" {
  import React from "react";
  const SVG: React.VFC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}