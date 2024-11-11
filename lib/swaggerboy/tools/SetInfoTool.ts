import { z } from "zod";
import { Tool } from "@/lib/ai/Tool";
import { SpecManager } from "@/lib/spec-manager/SpecManager";
import { Swaggerboy } from "..";
import { InfoObject } from "../spec-schema";

const setInfoInputSchema = z.object({
	info: InfoObject.describe(
		"The OpenAPI info object to describe the API"
	).passthrough(),
});

const setInfoOutputSchema = z.string();

export class SetInfoTool extends Tool<
	typeof setInfoInputSchema,
	typeof setInfoOutputSchema
> {
	specManager: SpecManager;

	constructor(specManager: SpecManager, agent: Swaggerboy) {
		super(
			"Set-Info",
			"Use this tool to set the info object for the OpenAPI Specification.",
			setInfoInputSchema,
			agent
		);

		this.specManager = specManager;
	}

	async run(
		input: z.infer<typeof setInfoInputSchema>
	): Promise<z.infer<typeof setInfoOutputSchema>> {
		await this.specManager.setInfo(input.info).saveSpec();

		return "The info object has been set.";
	}
}
