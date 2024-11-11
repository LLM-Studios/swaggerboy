import { z } from "zod";
import { Tool } from "@/lib/ai/Tool";
import { SpecManager } from "@/lib/spec-manager/SpecManager";
import { Swaggerboy } from "..";
import { ExampleObject } from "../spec-schema";

const setExampleInputSchema = z.object({
	name: z.string({ description: "The name of the example" }),
	example: ExampleObject.describe(
		"The example object to set. If the example is an empty object or null, it will be removed."
	)
		.passthrough()
		.optional(),
});

const setExampleOutputSchema = z.string();

export class SetExampleTool extends Tool<
	typeof setExampleInputSchema,
	typeof setExampleOutputSchema
> {
	specManager: SpecManager;

	constructor(specManager: SpecManager, agent: Swaggerboy) {
		super(
			"Set-Example-Component",
			"Use this tool to set a example component in the OpenAPI Specification. If the example is an empty object or null, it will be removed.",
			setExampleInputSchema,
			agent
		);

		this.specManager = specManager;
	}

	async run(
		input: z.infer<typeof setExampleInputSchema>
	): Promise<z.infer<typeof setExampleOutputSchema>> {
		// Check if the example is empty or null
		if (!input.example || Object.keys(input.example).length === 0) {
			// Remove the example from the OpenAPI specification
			await this.specManager.removeExampleComponent(input.name).saveSpec();
			return `Example ${input.name} has been removed.`;
		}

		// Update the OpenAPI specification with the new example
		await this.specManager
			.addExampleComponent(input.name, input.example)
			.saveSpec();

		return `Example ${input.name} has been updated.`;
	}
}
