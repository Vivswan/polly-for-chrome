declare global {
	interface Window {
		clients: any;
	}

	declare const clients: any;
}

// YAML module declarations
declare module "*.yaml" {
	const content: any;
	export default content;
}

declare module "*.yml" {
	const content: any;
	export default content;
}

export {};
