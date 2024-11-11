"use server";

import { getConfig } from "@/lib/config";
import { LocalAdapterConfig } from "@/lib/spec-manager/adapters/local-storage-adapter";
import { getAdapter } from "@/lib/spec-manager/adapters/storage-adapter";
import { VercelAdapterConfig } from "@/lib/spec-manager/adapters/vercel-storage-adapter";
import { SpecManager } from "@/lib/spec-manager/SpecManager";

export const getSpec = async (threadId: string) => {
	try {
		const config = getConfig();
		const adapterConfig =
			config.storageType === "local"
				? ({ openapiPath: config.openapiPath } as LocalAdapterConfig)
				: ({ path: threadId } as VercelAdapterConfig);

		const storage = getAdapter({
			type: config.storageType,
			config: adapterConfig,
		});

		const specManager = await SpecManager.init(storage);
		const spec = specManager.getSpec();

		if (!spec) {
			return {
				error: "Error loading spec: Spec not found",
			};
		}

		spec.servers = [{ url: config.apiBase }];

		return { spec };
	} catch (error) {
		console.error("Error loading spec", error);
		return {
			error: "Error loading spec: " + ((error as any).message ?? "Unknown"),
		};
	}
};
