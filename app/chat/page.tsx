"use client";

import { useEffect, useState } from "react";
import { resetThread } from "@/app/actions/thread";
import { Loader2 } from "lucide-react";
import ErrorMessage from "@/components/error";
import { useRouter } from "next/navigation";

type Params = { threadId: string };

export default function CreateChatPage(props: { params: Params }) {
	const [error, setError] = useState<Error | null>(null);
	const { push } = useRouter();

	useEffect(() => {
		resetThread()
			.then(({ threadId, messages, error }) => {
				if (error) {
					throw new Error(error);
				}
				push(`/chat/${threadId}`);
			})
			.catch((error) => {
				setError(error);
			});
	}, []);

	return error ? (
		<ErrorMessage error={error} reset={() => push(`/chat`)} />
	) : (
		<div className="flex h-screen w-screen justify-center items-center">
			<div className="flex flex-col items-center justify-center h-full">
				<h3 className="text-2xl font-bold">Loading...</h3>
				<Loader2 className="w-10 h-10 mt-4 animate-spin" />
			</div>
		</div>
	);
}
