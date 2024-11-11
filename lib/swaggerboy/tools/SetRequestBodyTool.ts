import { z } from "zod";
import { Tool } from "@/lib/ai/Tool";
import { SpecManager } from "@/lib/spec-manager/SpecManager";
import { RequestBodyObject } from "../spec-schema";
import { Swaggerboy } from "..";

const setRequestBodyInputSchema = z.object({
	name: z.string({ description: "The name of the requestBody component" }),
	requestBody: RequestBodyObject.describe(
		"The requestBody object to set. If the requestBody is an empty object or null, it will be removed."
	)
		.passthrough()
		.optional(),
});

const setRequestBodyOutputSchema = z.string();

export class SetRequestBodyTool extends Tool<
	typeof setRequestBodyInputSchema,
	typeof setRequestBodyOutputSchema
> {
	specManager: SpecManager;

	constructor(specManager: SpecManager, agent: Swaggerboy) {
		super(
			"Set-RequestBody-Component",
			"Use this tool to set a requestBody component in the OpenAPI Specification. If the requestBody is an empty object or null, it will be removed.",
			setRequestBodyInputSchema,
			agent
		);

		this.specManager = specManager;
	}

	async run(
		input: z.infer<typeof setRequestBodyInputSchema>
	): Promise<z.infer<typeof setRequestBodyOutputSchema>> {
		// Check if the request body is empty or null
		if (!input.requestBody || Object.keys(input.requestBody).length === 0) {
			// Remove the request body from the OpenAPI specification
			await this.specManager.removeRequestBodyComponent(input.name).saveSpec();

			return `Request body ${input.name} has been removed.`;
		}

		// Update the OpenAPI specification with the new request body
		await this.specManager
			.addRequestBodyComponent(input.name, input.requestBody as any)
			.saveSpec();

		return `Request body ${input.name} has been updated.`;
	}
}
