import { z } from "zod";
import { Tool } from "@/lib/ai/Tool";
import { SpecManager } from "@/lib/spec-manager/SpecManager";
import { Swaggerboy } from "..";

const saveSpecInputSchema = z.object({}).passthrough().optional();
const saveSpecOutputSchema = z.string();

export class SaveSpecTool extends Tool<
	typeof saveSpecInputSchema,
	typeof saveSpecOutputSchema
> {
	specManager: SpecManager;

	constructor(specManager: SpecManager, agent: Swaggerboy) {
		super(
			"Save-OpenAPI-Specification",
			"Use this tool to save the current OpenAPI Specification. Use this tool after making changes to the specification to persist the changes.",
			saveSpecInputSchema,
			agent
		);

		this.specManager = specManager;
	}

	async run(
		input: z.infer<typeof saveSpecInputSchema>
	): Promise<z.infer<typeof saveSpecOutputSchema>> {
		await new Promise((resolve) => setTimeout(resolve, 3000));
		await this.specManager.saveSpec().catch((err) => {
			throw new Error(`Failed to save the OpenAPI Specification: ${err}`);
		});

		return `OpenAPI Specification saved successfully.`;
	}
}
