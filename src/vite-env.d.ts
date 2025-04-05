/// <reference types="vite/client" />

interface ImportMeta {
    glob: import('vite').ImportGlobFunction;
}

// For JSON imports
declare module "*.json" {
    const value: any;
    export default value;
}