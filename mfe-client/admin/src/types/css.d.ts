// Rspack turns a bare `import './x.css'` into a style injection, but TS needs a
// declaration for a side-effect import or every such line fails with TS2882.
declare module '*.css';
