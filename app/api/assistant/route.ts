import { getConfig } from "@/lib/config";
import { LocalAdapterConfig } from "@/lib/spec-manager/adapters/local-storage-adapter";
import { VercelAdapterConfig } from "@/lib/spec-manager/adapters/vercel-storage-adapter";
import { Swaggerboy } from "@/lib/swaggerboy";
import { AssistantResponse } from "ai";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
	// Parse the request body
	const input: {
		message: string;
		threadId: string;
	} = await req.json();
	const { threadId, message } = input;

	const config = getConfig();
	const adapterConfig =
		config.storageType === "local"
			? ({ openapiPath: config.openapiPath } as LocalAdapterConfig)
			: ({ path: threadId } as VercelAdapterConfig);

	const storageOptions = {
		type: config.storageType,
		config: adapterConfig,
	};

	const swaggerboy = await Swaggerboy.init(threadId, {
		storage: storageOptions,
	});

	// Add a message to the thread
	const createdMessage = await swaggerboy.addMessage(message);

	return AssistantResponse(
		{ threadId, messageId: createdMessage.id },
		async ({ forwardStream, sendDataMessage, sendMessage }) => {
			const runStream = await swaggerboy.runStream({
				forwardStream,
				sendDataMessage,
				sendMessage,
			});

			const runResult = await forwardStream(runStream);
			if (!runResult) throw new Error("Run result is undefined");
			await swaggerboy.handleRunResult(runResult);
		}
	);
}
