import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import Image from "next/image";
import { Card } from "./ui/card";

export const NavBar = ({ children }: { children?: React.ReactNode }) => {
	return (
		<div className="absolute top-0 left-0 w-full p-4 pt-5 bg-transparent z-50">
			<Card className="flex flex-row w-full items-center justify-between light:bg-white dark:bg-black p-1">
				<Link href="/" className="flex items-center flex-row pl-2 gap-2">
					<h1 className="text-xl font-bold">Swaggerboy</h1>
				</Link>
				<div className="flex flex-row gap-2">
					{children}
					<ThemeToggle />
				</div>
			</Card>
		</div>
	);
};
