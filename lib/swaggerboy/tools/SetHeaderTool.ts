import { z } from "zod";
import { Tool } from "@/lib/ai/Tool";
import { SpecManager } from "@/lib/spec-manager/SpecManager";
import { Swaggerboy } from "..";
import { HeaderObject } from "../spec-schema";

const setHeaderInputSchema = z.object({
	name: z.string({ description: "The name of the header component" }),
	header: HeaderObject.describe(
		"The header object to set. If the header is an empty object or null, it will be removed."
	).optional(),
});

const setHeaderOutputSchema = z.string();

export class SetHeaderTool extends Tool<
	typeof setHeaderInputSchema,
	typeof setHeaderOutputSchema
> {
	specManager: SpecManager;

	constructor(specManager: SpecManager, agent: Swaggerboy) {
		super(
			"Set-Header-Component",
			"Use this tool to set a header component in the OpenAPI Specification. If the header is an empty object or null, it will be removed.",
			setHeaderInputSchema,
			agent
		);

		this.specManager = specManager;
	}

	async run(
		input: z.infer<typeof setHeaderInputSchema>
	): Promise<z.infer<typeof setHeaderOutputSchema>> {
		// Check if the header is empty or null
		if (!input.header || Object.keys(input.header).length === 0) {
			// Remove the header from the OpenAPI specification
			await this.specManager.removeHeaderComponent(input.name).saveSpec();
			return `Header ${input.name} has been removed.`;
		}

		// Update the OpenAPI specification with the new header
		await this.specManager
			.addHeaderComponent(input.name, input.header)
			.saveSpec();

		return `Header ${input.name} has been updated.`;
	}
}
