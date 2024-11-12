import { OpenAI } from "openai";
import type {
	RequiredActionFunctionToolCall,
	Run,
	RunCreateParams,
	RunCreateParamsNonStreaming,
	RunSubmitToolOutputsParams,
} from "openai/src/resources/beta/threads/index.js";
import type { Tool } from "./Tool";
import type { AssistantStream } from "openai/lib/AssistantStream.js";
import { AssistantMessage, DataMessage } from "ai";
import { stringify } from "yaml";
import {
	Message,
	MessageCreateParams,
} from "openai/resources/beta/threads/messages.mjs";

const openai = new OpenAI();

export interface RunContext {
	forwardStream: (runStream: AssistantStream) => Promise<Run | undefined>;
	sendDataMessage: (message: DataMessage) => void;
	sendMessage: (message: AssistantMessage) => void;
}

export class AssistantAgent {
	config: RunCreateParams;
	threadId: string;
	runContext: {
		forwardStream: (runStream: AssistantStream) => Promise<Run | undefined>;
		sendDataMessage: (message: DataMessage) => void;
		sendMessage: (message: AssistantMessage) => void;
	} | null = null;
	metadata: Record<string, any> = {};
	toolCallStack: (RequiredActionFunctionToolCall & { output: any })[] = [];
	runCount = 0;

	constructor(threadId: string, config: RunCreateParams) {
		this.config = config;
		this.threadId = threadId;
	}

	getMetadata() {
		return this.metadata;
	}

	getRunContext() {
		return this.runContext;
	}

	async getTools(): Promise<Tool[]> {
		return [];
	}

	async getTool(name: string): Promise<Tool> {
		const tool = await this.getTools().then((tools) =>
			tools.find((tool) => tool.name === name)
		);
		if (!tool) {
			throw new Error(`Tool not found: ${name}`);
		}
		return tool;
	}

	async getInstructions(): Promise<string> {
		return "You are a helpful assistant.";
	}

	async onAfterRun(run: Run) {}

	async runStream(runContext?: RunContext | null) {
		this.runContext = runContext ?? this.runContext;
		const runTools = (await this.getTools()).map((tool) =>
			tool.toAssistantTool()
		);
		const runInstructions = await this.getInstructions();

		const runStream = openai.beta.threads.runs.stream(this.threadId, {
			...this.config,
			assistant_id: this.config.assistant_id,
			tools: runTools,
			instructions: runInstructions,
			model: this.config.model,
			stream: true,
		});

		return runStream;
	}

	async runSync(runContext?: RunContext | null) {
		this.runContext = runContext ?? this.runContext;
		const runTools = (await this.getTools()).map((tool) =>
			tool.toAssistantTool()
		);

		const runInstructions = await this.getInstructions();

		const run = await openai.beta.threads.runs.createAndPoll(this.threadId, {
			...(this.config as RunCreateParamsNonStreaming),
			assistant_id: this.config.assistant_id,
			tools: runTools,
			instructions: runInstructions,
			model: this.config.model,
		});

		const finalRun = await this.handleRunResult(run, { stream: false });
		return finalRun;
	}

	async submitToolOutputsStream(
		runId: string,
		toolOutputs: RunSubmitToolOutputsParams.ToolOutput[]
	) {
		return openai.beta.threads.runs.submitToolOutputsStream(
			this.threadId,
			runId,
			{
				tool_outputs: toolOutputs,
				stream: true,
			}
		);
	}

	async runTool(toolCall: RequiredActionFunctionToolCall) {
		this.runContext?.sendMessage({
			id: toolCall.id,
			role: "assistant",
			content: [
				{
					type: "text",
					text: {
						value:
							"###TOOL_CALL###" +
							JSON.stringify(toolCall) +
							"###TOOL_CALL_END###",
					},
				},
			],
		});

		const parameters = JSON.parse(toolCall.function.arguments);
		const tool = await this.getTool(toolCall.function.name);
		return tool.run(parameters).then((output: any) => {
			this.toolCallStack.push({
				...toolCall,
				output: output,
			});
			return output;
		});
	}

	async handleRunResult(
		runResult: Run,
		options: { stream: boolean } = { stream: true }
	): Promise<Run> {
		if (
			runResult?.status === "requires_action" &&
			runResult.required_action?.type === "submit_tool_outputs"
		) {
			const tool_outputs = await Promise.all(
				runResult.required_action.submit_tool_outputs.tool_calls.map(
					async (toolCall) => {
						try {
							const output = await this.runTool(toolCall).catch((error) => {
								console.error("Error running tool:", error);
								return {
									output: stringify({
										error: error.message ?? "Unknown error",
									}),
									tool_call_id: toolCall.id,
								};
							});
							const toolOutput = {
								output: JSON.stringify(output),
								tool_call_id: toolCall.id,
							} as RunSubmitToolOutputsParams.ToolOutput;
							this.runContext?.sendDataMessage({
								id: toolOutput.tool_call_id,
								role: "data",
								data: JSON.stringify({
									input: toolCall.function,
									output: toolOutput.output,
								}),
							});
							return toolOutput;
						} catch (error) {
							console.error("Error running tool:", error);
							return {
								output: JSON.stringify({
									error: "Failed to run tool",
								}),
								tool_call_id: toolCall.id,
							};
						}
					}
				)
			);

			if (options.stream) {
				const runResultStream = await this.submitToolOutputsStream(
					runResult.id,
					tool_outputs
				);
				runResultStream.on("messageDone", (message) => {});

				const nextRunResult = await this.runContext?.forwardStream(
					runResultStream
				);

				if (!nextRunResult) throw new Error("Next run result is undefined");

				return this.handleRunResult(nextRunResult, options);
			} else {
				const nextRunResult =
					await openai.beta.threads.runs.submitToolOutputsAndPoll(
						this.threadId,
						runResult.id,
						{
							tool_outputs,
						}
					);

				return this.handleRunResult(nextRunResult, options);
			}
		} else {
			this.runCount++;
			await this.onAfterRun(runResult);
			return runResult;
		}
	}

	async addMessage(
		message: string,
		options?: Partial<MessageCreateParams>
	): Promise<Message> {
		return openai.beta.threads.messages
			.create(this.threadId, {
				role: "user",
				...options,
				content: message,
			})
			.catch(async (error) => {
				// cancel the run if the message cannot be added
				if (
					(error.message as string).includes("Can't add messages to thread_")
				) {
					const run = await openai.beta.threads.runs
						.list(this.threadId, {
							limit: 1,
							order: "desc",
						})
						.then((response) => response.data[0]);
					if (run) {
						await openai.beta.threads.runs.cancel(this.threadId, run.id);
					}

					return this.addMessage(message);
				}
				throw error;
			});
	}
}
