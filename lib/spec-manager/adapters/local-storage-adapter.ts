import fs from "node:fs";
import { StorageAdapter } from "./storage-adapter";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { baseOpenApiSpec } from "../utils";

export interface LocalAdapterConfig {
	openapiPath: string;
}

export class LocalStorageAdapter implements StorageAdapter {
	constructor(private openapiPath: string) {}

	async read(): Promise<OpenAPIObject> {
		try {
			return JSON.parse(
				await fs.readFileSync(this.openapiPath, "utf8")
			) as OpenAPIObject;
		} catch (_err) {
			console.warn("Failed to load OpenAPI spec. Creating a new one...");
			const spec = baseOpenApiSpec;
			await this.write(spec);
			return spec;
		}
	}

	async write(spec: OpenAPIObject): Promise<void> {
		await fs.writeFileSync(this.openapiPath, JSON.stringify(spec, null, 2));
	}
}
