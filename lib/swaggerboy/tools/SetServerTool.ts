import { z } from "zod";
import { Tool } from "@/lib/ai/Tool";
import { SpecManager } from "@/lib/spec-manager/SpecManager";
import { Swaggerboy } from "..";
import { ServerObject } from "../spec-schema";

const setServerInputSchema = z.object({
	servers: z.array(
		ServerObject.describe(
			"The server object to set. If the server is an empty object or null, it will be removed."
		)
			.passthrough()
			.optional()
	),
});

const setServerOutputSchema = z.string();

export class SetServerTool extends Tool<
	typeof setServerInputSchema,
	typeof setServerOutputSchema
> {
	specManager: SpecManager;

	constructor(specManager: SpecManager, agent: Swaggerboy) {
		super(
			"Set-Server",
			"Use this tool to set the documentation for the server in the OpenAPI Specification. If the server is an empty object or null, it will be removed.",
			setServerInputSchema,
			agent
		);

		this.specManager = specManager;
	}

	async run(
		input: z.infer<typeof setServerInputSchema>
	): Promise<z.infer<typeof setServerOutputSchema>> {
		// Check if the server is empty or null
		if (!input.servers || Object.keys(input.servers).length === 0) {
			// Remove the server from the OpenAPI specification
			await this.specManager.removeServer().saveSpec();

			return "The server config has been removed.";
		} else {
			await this.specManager.setServers(input.servers as any).saveSpec();

			return "The server config has been updated.";
		}
	}
}
