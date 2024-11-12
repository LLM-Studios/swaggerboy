"use client";

import { useAssistant } from "ai/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import { OpenapiView } from "@/components/docs/openapi-docs";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Thread } from "@/components/chat/thread";
import { loadThreadMessages } from "@/app/actions/thread";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/nav-bar";
import ErrorMessage from "@/components/error";
import { useRouter } from "next/navigation";

type Params = { threadId: string };

export default function ChatPage(props: { params: Params }) {
	const params = props.params;
	const [isLoaded, setIsLoaded] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const { push } = useRouter();

	const assistant = useAssistant({
		api: "/api/assistant",
		threadId: params.threadId,
	});

	const runtime = useVercelUseAssistantRuntime(assistant);

	useEffect(() => {
		loadThreadMessages(params.threadId)
			.then((messages) => {
				if (messages.error || !messages.messages) {
					throw new Error(messages.error);
				}

				assistant.setMessages(messages.messages);
				setIsLoaded(true);
			})
			.catch((error) => {
				setError(error);
			});
	}, []);

	const reset = () => {
		setError(null);
		setIsLoaded(false);
		push(`/chat`);
	};

	return error ? (
		<ErrorMessage error={error} reset={reset} />
	) : (
		<div className="flex h-screen">
			<AssistantRuntimeProvider runtime={runtime}>
				<div className="w-2/5 overflow-hidden flex flex-col relative">
					<NavBar>
						<Button
							className="border"
							variant={"outline"}
							onClick={reset}
							size="icon"
						>
							<Trash2 className="w-5 h-5" />
						</Button>
					</NavBar>
					<div className="flex-1 overflow-y-auto">
						{isLoaded ? (
							<Thread />
						) : (
							<div className="flex items-center justify-center h-full">
								<Loader2 className="w-10 h-10 animate-spin" />
							</div>
						)}
					</div>
				</div>
				<div className="flex w-3/5 m-4 ml-0 flex-col">
					<Card className="w-full h-full overflow-hidden flex flex-col bg-white !border-white rounded-2xl">
						<div className="flex-1 overflow-y-auto">
							<OpenapiView threadId={params.threadId} />
						</div>
					</Card>
				</div>
			</AssistantRuntimeProvider>
		</div>
	);
}
