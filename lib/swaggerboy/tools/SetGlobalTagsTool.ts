import { z } from "zod";
import { Tool } from "@/lib/ai/Tool";
import { SpecManager } from "@/lib/spec-manager/SpecManager";
import { Swaggerboy } from "..";
import { nonEmptyString, SchemaObject } from "../spec-schema";

const setGlobalTagsInputSchema = z.object({
	tags: z
		.array(
			z.object({
				name: nonEmptyString,
				description: z.string().optional(),
			})
		)
		.describe("The tags to set as global tags.")
		.optional(),
});

const setGlobalTagsOutputSchema = z.string();

export class setGlobalTagsTool extends Tool<
	typeof setGlobalTagsInputSchema,
	typeof setGlobalTagsOutputSchema
> {
	specManager: SpecManager;

	constructor(specManager: SpecManager, agent: Swaggerboy) {
		super(
			"Set-Global-Tags",
			"Use this tool to set the global tags in the OpenAPI specification.",
			setGlobalTagsInputSchema,
			agent
		);

		this.specManager = specManager;
	}

	async run(
		input: z.infer<typeof setGlobalTagsInputSchema>
	): Promise<z.infer<typeof setGlobalTagsOutputSchema>> {
		// Check if the schema is empty or null
		if (!input.tags || input.tags.length === 0) {
			// Remove the schema from the OpenAPI specification
			await this.specManager.setTags([]);
			return `Global tags have been cleared.`;
		}

		// Update the OpenAPI specification with the new schema
		await this.specManager.setTags(input.tags).saveSpec();

		return `Global tags have been set.`;
	}
}
