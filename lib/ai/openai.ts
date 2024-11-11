import getConfig from "next/config";
import { OpenAI } from "openai";

export const openai = new OpenAI();

export const getAssistant = async (name: string = "Swaggerboy") => {
	const config = getConfig();
	if (config.assistantId && config.assistantId !== "undefined") {
		const assistant = openai.beta.assistants.retrieve(config.assistantId);
		return assistant;
	} else {
		const list = await openai.beta.assistants.list();
		const existingSwaggerboy = list.data.find(
			(assistant) => assistant.name === name
		);
		if (existingSwaggerboy) {
			process.env.OPENAI_ASSISTANT_ID = existingSwaggerboy.id;
			return existingSwaggerboy;
		} else {
			const newAssistant = await openai.beta.assistants.create({
				name: name,
				model: "gpt-4o",
				description: "AI-Copilot for API design and OpenAPI documentation",
			});
			process.env.OPENAI_ASSISTANT_ID = newAssistant.id;
			return newAssistant;
		}
	}
};
