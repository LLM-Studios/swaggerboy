import { z } from "zod";
import { Tool } from "@/lib/ai/Tool";
import { SpecManager } from "@/lib/spec-manager/SpecManager";
import { Swaggerboy } from "..";
import { stringify } from "yaml";

const validateSpecInputSchema = z.object({});

const validateSpecOutputSchema = z.string();

export class ValidateSpecTool extends Tool<
	typeof validateSpecInputSchema,
	typeof validateSpecOutputSchema
> {
	specManager: SpecManager;

	constructor(specManager: SpecManager, agent: Swaggerboy) {
		super(
			"Validate-Spec",
			"Use this tool to validate the current OpenAPI Specification document.",
			validateSpecInputSchema,
			agent
		);

		this.specManager = specManager;
	}

	async run(
		input: z.infer<typeof validateSpecInputSchema>
	): Promise<z.infer<typeof validateSpecOutputSchema>> {
		const validation = await this.specManager.validateSpec();

		return `Validation: ${stringify(validation)}`;
	}
}
