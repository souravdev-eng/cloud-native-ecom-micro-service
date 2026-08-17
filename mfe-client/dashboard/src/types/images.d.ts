declare module '*.jpg' {
	const content: string;
	export default content;
}

declare module '*.jpeg' {
	const content: string;
	export default content;
}

declare module '*.png' {
	const content: string;
	export default content;
}

declare module '*.gif' {
	const content: string;
	export default content;
}

declare module '*.svg' {
	const content: string;
	export default content;
}

declare module '*.webp' {
	const content: string;
	export default content;
}

// Rspack turns a bare `import './index.css'` into a style injection; TS needs a
// declaration for the side-effect import or App.tsx fails type-check (TS2882).
declare module '*.css';
