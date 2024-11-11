import { z } from "zod";
import { Tool } from "@/lib/ai/Tool";
import { SpecManager } from "@/lib/spec-manager/SpecManager";
import { ResponseObject } from "../spec-schema";
import { Swaggerboy } from "..";

const setResponseInputSchema = z.object({
	name: z.string({ description: "The name of the response component" }),
	response: ResponseObject.describe(
		"The response object to set. If the response is an empty object or null, it will be removed."
	)
		.passthrough()
		.optional(),
});

const setResponseOutputSchema = z.string();

export class SetResponseTool extends Tool<
	typeof setResponseInputSchema,
	typeof setResponseOutputSchema
> {
	specManager: SpecManager;

	constructor(specManager: SpecManager, agent: Swaggerboy) {
		super(
			"Set-Response-Component",
			"Use this tool to set a response component in the OpenAPI Specification. If the response is an empty object or null, it will be removed.",
			setResponseInputSchema,
			agent
		);

		this.specManager = specManager;
	}

	async run(
		input: z.infer<typeof setResponseInputSchema>
	): Promise<z.infer<typeof setResponseOutputSchema>> {
		// Check if the response is empty or null
		if (!input.response || Object.keys(input.response).length === 0) {
			// Remove the response from the OpenAPI specification
			await this.specManager.removeResponseComponent(input.name).saveSpec();

			return `Response ${input.name} has been removed.`;
		}

		// Update the OpenAPI specification with the new response
		await this.specManager
			.addResponseComponent(input.name, input.response as any)
			.saveSpec();

		return `Response ${input.name} has been updated.`;
	}
}
