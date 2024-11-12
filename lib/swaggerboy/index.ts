import { AssistantAgent } from "../ai/Assistant";
import { SpecManager } from "../spec-manager/SpecManager";
import { SetEndpointTool } from "./tools/SetEndpointTool";
import { SetHeaderTool } from "./tools/SetHeaderTool";
import { SetSchemaTool } from "./tools/SetSchemaTool";
import { SetResponseTool } from "./tools/SetResponseTool";
import { SetRequestBodyTool } from "./tools/SetRequestBodyTool";
import { SetParameterTool } from "./tools/SetParameterTool";
import { OverwriteSpecTool } from "./tools/SetOpenAPISpec";
import { SetExampleTool } from "./tools/SetExampleTool";
import { SetInfoTool } from "./tools/SetInfoTool";
import { getAssistant } from "../ai/openai";
import systemInstructions from "./system-instructions";
import {
	getAdapter,
	StorageAdapter,
	StorageAdapterOptions,
} from "../spec-manager/adapters/storage-adapter";
import { SetServerTool } from "./tools/SetServerTool";
import { ValidateSpecTool } from "./tools/ValidateSpecTool";
import { setGlobalTagsTool } from "./tools/SetGlobalTagsTool";

export interface SwaggerboyOptions {
	storage: StorageAdapterOptions;
}

export class Swaggerboy extends AssistantAgent {
	specManager: SpecManager;

	private constructor(
		threadId: string,
		assistantId: string,
		specManager: SpecManager
	) {
		super(threadId, {
			assistant_id: assistantId,
			model: "gpt-4o",
		});
		this.specManager = specManager;
	}

	static async init(threadId: string, options: SwaggerboyOptions) {
		const storage: StorageAdapter = getAdapter(options.storage);
		const [specManager, assistant] = await Promise.all([
			SpecManager.init(storage),
			getAssistant(),
		]);

		return new Swaggerboy(threadId, assistant.id, specManager);
	}

	async getTools() {
		return [
			new SetEndpointTool(this.specManager, this),
			new SetServerTool(this.specManager, this),
			new SetHeaderTool(this.specManager, this),
			new SetSchemaTool(this.specManager, this),
			new SetResponseTool(this.specManager, this),
			new SetRequestBodyTool(this.specManager, this),
			new SetParameterTool(this.specManager, this),
			new SetExampleTool(this.specManager, this),
			new OverwriteSpecTool(this.specManager, this),
			new SetInfoTool(this.specManager, this),
			new ValidateSpecTool(this.specManager, this),
			new setGlobalTagsTool(this.specManager, this),
		];
	}

	async onAfterRun() {
		await this.specManager.saveSpec().catch(async (err) => {
			if (this.runCount <= 3) {
				await this.addMessage(
					"Failed to save the OpenAPI Specification: " +
						err +
						"\n\n" +
						"I'll try to resolve this issue right away.",
					{
						role: "assistant",
					}
				);
				await this.runSync();
			} else {
				await this.addMessage(
					"There seems to be an issue with saving the OpenAPI Specification. Please try again later.",
					{
						role: "assistant",
					}
				);
			}
		});
	}

	async getInstructions() {
		const spec = this.specManager.getSpec();

		return (
			systemInstructions +
			"\n\n## Current OpenAPI Specification:\n" +
			JSON.stringify(spec, null, 2)
		);
	}
}
