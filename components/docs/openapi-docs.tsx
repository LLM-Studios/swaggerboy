"use client";

import { useEffect, useState } from "react";
import { API } from "@stoplight/elements";
import { getSpec } from "@/app/actions/spec";
import "./styles.css";

export function OpenapiView({ threadId }: { threadId: string }) {
	const [docs, setDocs] = useState(null as any);

	const getDocs = async () => {
		try {
			if (!threadId) {
				return;
			}
			const newDocs = await getSpec(threadId);

			if (newDocs.error || !newDocs.spec) {
				console.error("Failed to fetch docs:", newDocs.error);
				throw new Error(newDocs.error);
			}

			if (newDocs.spec !== docs) {
				setDocs(newDocs.spec);
			}
		} catch (error) {
			console.error("Failed to fetch docs:", error);
		}
	};

	useEffect(() => {
		getDocs();
		const interval = setInterval(getDocs, 3000);
		return () => clearInterval(interval);
	}, []);

	if (!docs) {
		return null;
	}

	return (
		<div className="bg-white h-full">
			<API apiDescriptionDocument={docs} router="memory" layout="responsive" />
		</div>
	);
}
