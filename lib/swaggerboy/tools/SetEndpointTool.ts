import { z } from "zod";
import { Tool } from "@/lib/ai/Tool";
import { SpecManager } from "@/lib/spec-manager/SpecManager";
import { Swaggerboy } from "..";
import { OperationObject } from "../spec-schema";

const setEndpointInputSchema = z.object({
	path: z.string({ description: "The path of the endpoint" }),
	method: z.string({ description: "The HTTP method of the endpoint" }),
	operation: OperationObject.describe(
		"The OpenAPI operation object. Provide a detailed operation object for a well documented endpoint. Include x-implementation-details for additional implementation details."
	)
		.passthrough()
		.optional(),
});

const setEndpointOutputSchema = z.string();

export class SetEndpointTool extends Tool<
	typeof setEndpointInputSchema,
	typeof setEndpointOutputSchema
> {
	specManager: SpecManager;

	constructor(specManager: SpecManager, agent: Swaggerboy) {
		super(
			"Set-Endpoint-Operation",
			"Use this tool to set the documentation for a enpoint operation for an given path in the OpenAPI Specification. Create detailed well thought out documentation for a given endpoint path. Include additional information and implementation details using the x-implementation-details field. If the operation is an empty object or null, the endpoint will be removed.",
			setEndpointInputSchema,
			agent
		);

		this.specManager = specManager;
	}

	async run(
		input: z.infer<typeof setEndpointInputSchema>
	): Promise<z.infer<typeof setEndpointOutputSchema>> {
		// Check if the operation is empty or null
		if (!input.operation || Object.keys(input.operation).length === 0) {
			// Remove the endpoint from the OpenAPI specification
			await this.specManager
				.removeEndpoint(input.path, input.method)
				.saveSpec();

			return "The endpoint has been removed.";
		} else {
			// Update the OpenAPI specification with the new endpoint
			await this.specManager
				.addEndpoint(input.path, input.method, input.operation)
				.saveSpec();

			return "The endpoint has been updated.";
		}
	}
}
