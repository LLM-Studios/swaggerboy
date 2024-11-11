import {
	Thread as AuiThread,
	ContentPartPrimitiveTextProps,
	ThreadWelcome,
	useContentPartText,
	useMessage,
	type ThreadConfig,
} from "@assistant-ui/react";
import { FC } from "react";
import { Composer } from "./composer";

import { MarkdownText } from "@/components/chat/markdown-text";
import { Hammer, Loader2 } from "lucide-react";
import { Card } from "../ui/card";

const MyCustomText: FC<ContentPartPrimitiveTextProps> = (props) => {
	const { text } = useContentPartText();
	const message = useMessage();
	let isLast = false;

	if (
		message &&
		message.isLast &&
		message.content[message.content.length - 1] &&
		(message.content[message.content.length - 1] as any).text &&
		((message.content[message.content.length - 1] as any).text === text ||
			((message.content[message.content.length - 1] as any).text.endsWith(
				"Mode..."
			) &&
				message.isLast))
	) {
		isLast = true;
	}

	if (text.startsWith("###TOOL_CALL###")) {
		const toolCall = JSON.parse(
			text.replace("###TOOL_CALL###", "").replace("###TOOL_CALL_END###", "")
		);
		return (
			<Card className="flex items-center mb-4 p-1 rounded-full bg-slate-200 border-none dark:bg-card shadow-none w-auto max-w-max pr-6">
				<div>
					{isLast ? (
						<Loader2 className="h-9 w-9 p-1 border-2 border-primary rounded-full text-primary bg-secondary animate-spin" />
					) : (
						<Hammer className="h-9 w-9 p-1 border-2 border-primary rounded-full text-primary bg-secondary" />
					)}
				</div>
				<div className="ml-3">
					<p className="text-sm font-medium">Tool Call Executed</p>
					<p className="text-xs font-medium text-black/70 dark:text-white/70">
						{toolCall.function.name}
					</p>
				</div>
			</Card>
		);
	} else if (text.endsWith("Mode...")) {
		return null;
	}

	return <MarkdownText {...props} />;
};

export const Thread: FC<ThreadConfig> = (config) => {
	return (
		<AuiThread.Root
			className="!bg-background bg-black w-full max-w-none"
			config={{
				...config,
				assistantMessage: {
					allowCopy: false,

					components: {
						Text: MyCustomText as any,
					},
				},
			}}
		>
			<AuiThread.Viewport>
				<ThreadWelcome />
				<AuiThread.Messages />
				<AuiThread.FollowupSuggestions />
				<AuiThread.ViewportFooter>
					<AuiThread.ScrollToBottom />
					<Composer />
				</AuiThread.ViewportFooter>
			</AuiThread.Viewport>
		</AuiThread.Root>
	);
};
