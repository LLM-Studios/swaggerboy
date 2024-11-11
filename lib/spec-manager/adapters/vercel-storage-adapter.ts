import { StorageAdapter } from "./storage-adapter";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { kv } from "@vercel/kv";
import { baseOpenApiSpec } from "../utils";

export interface VercelAdapterConfig {
	path: string;
}

export class VercelStorageAdapter implements StorageAdapter {
	constructor(private path: string) {}

	async read(): Promise<OpenAPIObject> {
		const spec = await kv.get(this.path);

		if (!spec) {
			return baseOpenApiSpec;
		}

		return spec as OpenAPIObject;
	}

	async write(spec: OpenAPIObject): Promise<void> {
		await kv.set(this.path, spec);
	}
}
