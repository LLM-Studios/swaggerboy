import { OpenAPIObject } from "openapi3-ts/oas31";
import {
	LocalAdapterConfig,
	LocalStorageAdapter,
} from "./local-storage-adapter";
import {
	VercelAdapterConfig,
	VercelStorageAdapter,
} from "./vercel-storage-adapter";

export type StorageAdapterOptions = {
	type: "local" | "vercel";
	config: StorageAdapterConfig;
};

export type StorageAdapterConfig = LocalAdapterConfig | VercelAdapterConfig;

export interface StorageAdapter {
	read(): Promise<OpenAPIObject>;
	write(spec: OpenAPIObject): Promise<void>;
}

export const getAdapter = (options: StorageAdapterOptions): StorageAdapter => {
	if (options.type === "local") {
		if (!(options.config as LocalAdapterConfig).openapiPath) {
			throw new Error("Local storage requires a openapiPath");
		}

		return new LocalStorageAdapter(
			(options.config as LocalAdapterConfig).openapiPath
		);
	}

	if (!(options.config as VercelAdapterConfig).path) {
		throw new Error("Vercel storage requires a path");
	}

	return new VercelStorageAdapter((options.config as VercelAdapterConfig).path);
};
