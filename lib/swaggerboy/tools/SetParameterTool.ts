import { z } from "zod";
import { Tool } from "@/lib/ai/Tool";
import { SpecManager } from "@/lib/spec-manager/SpecManager";
import { Swaggerboy } from "..";
import { ParameterObject } from "../spec-schema";

const setParameterInputSchema = z.object({
	name: z.string({ description: "The name of the parameter component" }),
	parameter: ParameterObject.describe(
		"The parameter object to set. If the parameter is an empty object or null, it will be removed."
	)
		.passthrough()
		.optional(),
});

const setParameterOutputSchema = z.string();

export class SetParameterTool extends Tool<
	typeof setParameterInputSchema,
	typeof setParameterOutputSchema
> {
	specManager: SpecManager;

	constructor(specManager: SpecManager, agent: Swaggerboy) {
		super(
			"Set-Parameter-Component",
			"Use this tool to set a parameter component in the OpenAPI Specification. If the parameter is an empty object or null, it will be removed.",
			setParameterInputSchema,
			agent
		);

		this.specManager = specManager;
	}

	async run(
		input: z.infer<typeof setParameterInputSchema>
	): Promise<z.infer<typeof setParameterOutputSchema>> {
		// Check if the parameter is empty or null
		if (!input.parameter || Object.keys(input.parameter).length === 0) {
			// Remove the parameter from the OpenAPI specification
			await this.specManager.removeParameterComponent(input.name).saveSpec();

			return `Parameter ${input.name} has been removed.`;
		}

		// Update the OpenAPI specification with the new parameter
		await this.specManager
			.addParameterComponent(input.name, input.parameter as any)
			.saveSpec();

		return `Parameter ${input.name} has been updated.`;
	}
}
