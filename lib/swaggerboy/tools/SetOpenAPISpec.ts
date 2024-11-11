import { z } from "zod";
import { Tool } from "@/lib/ai/Tool";
import { SpecManager } from "@/lib/spec-manager/SpecManager";
import { Swaggerboy } from "..";
import { OpenAPIObject } from "../spec-schema";

const overwriteInputSchema = z.object({
	openapi_spec: OpenAPIObject.describe(
		"The complete OpenAPI Specification (3.1.0) JSON object."
	).passthrough(),
});

const overwriteOutputSchema = z.string();

export class OverwriteSpecTool extends Tool<
	typeof overwriteInputSchema,
	typeof overwriteOutputSchema
> {
	specManager: SpecManager;

	constructor(specManager: SpecManager, agent: Swaggerboy) {
		super(
			"Overwrite-Specification",
			"Use this tool to set a initial specification or overwrite the entire OpenAPI Specification. Caution: This tool sets the entire OpenAPI Specification. Use with caution and ensure that the input is correct.",
			overwriteInputSchema,
			agent
		);

		this.specManager = specManager;
	}

	async run(
		input: z.infer<typeof overwriteInputSchema>
	): Promise<z.infer<typeof overwriteOutputSchema>> {
		// Set the OpenAPI specification json object
		await this.specManager.setSpec(input.openapi_spec).saveSpec();

		return `OpenAPI Specification has been overwritten.`;
	}
}
