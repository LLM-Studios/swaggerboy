import { tool } from "ai";
import type { AssistantTool } from "openai/src/resources/beta/assistants.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AssistantAgent } from "./Assistant";

export abstract class Tool<
	PARAMS extends z.ZodType = any,
	OUTPUT extends z.ZodType = any,
	AGENT extends AssistantAgent = any
> {
	name: string;
	description: string;
	parameters: PARAMS;
	agent: AGENT;

	constructor(
		name: string,
		description: string,
		parameters: PARAMS,
		agent: AGENT
	) {
		this.name = name;
		this.description = description;
		this.parameters = parameters;
		this.agent = agent;
	}

	abstract run(
		input: z.infer<PARAMS>
	): Promise<z.infer<OUTPUT>> | z.infer<OUTPUT>;

	toAssistantTool(): AssistantTool {
		return {
			type: "function",
			function: {
				name: this.name,
				description: this.description,
				parameters: zodToJsonSchema(this.parameters) as Record<string, unknown>,
			},
		};
	}

	toAISdkTool() {
		return {
			[this.name]: tool({
				description: this.description,
				parameters: this.parameters,
				execute: async (input) => {
					const output = await this.run(input);
					return JSON.stringify(output);
				},
			}),
		};
	}
}
