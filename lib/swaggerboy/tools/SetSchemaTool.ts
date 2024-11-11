import { z } from "zod";
import { Tool } from "@/lib/ai/Tool";
import { SpecManager } from "@/lib/spec-manager/SpecManager";
import { Swaggerboy } from "..";
import { SchemaObject } from "../spec-schema";

const setSchemaInputSchema = z.object({
	name: z.string({ description: "The name of the schema component" }),
	schema: SchemaObject.describe(
		"The schema object to set. If the schema is an empty object or null, it will be removed."
	)
		.passthrough()
		.optional(),
});

const setSchemaOutputSchema = z.string();

export class SetSchemaTool extends Tool<
	typeof setSchemaInputSchema,
	typeof setSchemaOutputSchema
> {
	specManager: SpecManager;

	constructor(specManager: SpecManager, agent: Swaggerboy) {
		super(
			"Set-Schema-Component",
			"Use this tool to set a schema component in the OpenAPI Specification. If the schema is an empty object or null, it will be removed.",
			setSchemaInputSchema,
			agent
		);

		this.specManager = specManager;
	}

	async run(
		input: z.infer<typeof setSchemaInputSchema>
	): Promise<z.infer<typeof setSchemaOutputSchema>> {
		// Check if the schema is empty or null
		if (!input.schema || Object.keys(input.schema).length === 0) {
			// Remove the schema from the OpenAPI specification
			await this.specManager.removeSchemaComponent(input.name).saveSpec();
			return `Schema ${input.name} has been removed.`;
		}

		// Update the OpenAPI specification with the new schema
		await this.specManager
			.addSchemaComponent(input.name, input.schema)
			.saveSpec();

		return `Schema ${input.name} has been updated.`;
	}
}
