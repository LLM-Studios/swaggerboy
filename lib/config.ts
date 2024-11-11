import { loadEnvConfig } from "@next/env";

export function getConfig() {
	const projectDir = process.cwd();
	loadEnvConfig(projectDir);

	return {
		storageType: (process.env.STORAGE_ADAPTER_TYPE || "local") as
			| "local"
			| "vercel",
		openapiPath: process.env.NEXT_PUBLIC_OPENAPI_PATH || "./openapi.json",
		apiBase: process.env.API_BASE_URL || "http://localhost:3001",
		openAiApiKey: process.env.OPENAI_API_KEY,
		openAiAssistantId:
			process.env.OPENAI_ASSISTANT_ID !== "undefined"
				? process.env.OPENAI_ASSISTANT_ID
				: undefined,
	};
}
