import { XCircleIcon } from "lucide-react";
import { Button } from "./ui/button";

export default function ErrorMessage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="w-full p-12 mx-auto h-full justify-center items-center">
			<div className="rounded-md bg-red-50 p-4 max-w-3xl mx-auto mt-[30vh]">
				<div className="flex">
					<div className="flex-shrink-0">
						<XCircleIcon aria-hidden="true" className="h-5 w-5 text-red-400" />
					</div>
					<div className="ml-3">
						<h3 className="text-sm font-medium text-red-800">
							Oops! Something went wrong.
						</h3>
						<div className="mt-2 text-sm text-red-700">
							<ul role="list" className="list-disc space-y-1 pl-5">
								<li>{error?.message ?? "Unknown error"}</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
			<div className="w-full flex-row space-x-3 flex justify-center mt-8  font-semibold">
				<Button
					className="hover:bg-slate-900"
					variant={"ghost"}
					onClick={
						// Attempt to recover by trying to re-render the segment
						() => window && window.location.reload()
					}
				>
					Try again
				</Button>
				<Button
					className="hover:bg-slate-900"
					variant={"ghost"}
					onClick={
						// Attempt to recover by trying to re-render the segment
						() => reset()
					}
				>
					Reset
				</Button>
			</div>
		</div>
	);
}
