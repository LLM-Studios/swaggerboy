"use server";

import { openai } from "@/lib/ai/openai";

export const loadThreadMessages = async (threadId: string) => {
	try {
		const threadMessages = await openai.beta.threads.messages.list(threadId, {
			limit: 30,
			order: "desc",
		});

		return {
			messages: threadMessages.data.reverse().reduce((msgs, m) => {
				const messages = m.content
					.filter((c) => c.type === "text")
					.map((c, i) => ({
						id: m.id + i,
						content: c.text.value,
						role: m.role,
					}));

				return msgs.concat(messages);
			}, [] as { id: string; content: string; role: "user" | "assistant" }[]),
		};
	} catch (error) {
		console.error("Error loading thread messages", error);
		return {
			error:
				"Error loading thread messages: " +
				((error as any).message ?? "Unknown"),
		};
	}
};

export const resetThread = async () => {
	try {
		const threadId = (await openai.beta.threads.create()).id;
		return {
			threadId,
			messages: [],
		};
	} catch (error) {
		console.error("Error resetting thread", error);
		return {
			error: "Error resetting thread: " + ((error as any).message ?? "Unknown"),
		};
	}
};
