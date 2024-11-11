#!/usr/bin/env node

import { baseOpenApiSpec } from "@/lib/spec-manager/utils";
import { Command } from "commander";
import { existsSync, writeFileSync } from "fs";
import { spawn } from "node:child_process";
import path from "path";
import net from "net";
import readline from "readline";

// Get the directory where the package is installed (works with npx)
const pkgDir = path.join(__dirname, "..");
// Get the directory where the command is being run
const userDir = process.cwd();

const program = new Command("Swaggerboy");

program
	.name("Swaggerboy")
	.description("AI-Copilot to design and manage your OpenAPI specification.")
	.version("1.0.0")
	.option("-p, --port <port>", "Port to run the server on", "3000")
	.option("-k, --openai-api-key <key>", "OpenAI API Key")
	.option("-u, --api-base-url <url>", "API Base URL", "http://localhost:3001")
	.option("-a --openai-assistant-id <id>", "OpenAI Assistant ID")
	.option("-f, --openapi-path <openapi-path>", "Path to your openapi.json file")
	.parse(process.argv);

const options = program.opts() as {
	port: string;
	openapiPath?: string;
	openaiApiKey?: string;
	apiBaseUrl?: string;
	openaiAssistantId?: string;
};

async function prompt(
	question: string,
	defaultValue?: string
): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const defaultValueText = defaultValue ? ` (default: ${defaultValue})` : "";

	return new Promise((resolve) => {
		rl.question(`${question}${defaultValueText}: `, (answer) => {
			rl.close();
			const trimmedAnswer = answer.trim();
			resolve(trimmedAnswer || defaultValue || "");
		});
	});
}

async function promptForOpenAPIPath(): Promise<string> {
	const defaultPath = "./openapi.json";
	const openAPIPath = await prompt(
		"Enter the path for your OpenAPI specification",
		defaultPath
	);
	return openAPIPath;
}

async function promptForOpenAIKey(): Promise<string> {
	return prompt("Enter your OpenAI API Key");
}

async function findOpenAPIFile(openapiPath: string) {
	// Always resolve relative to user's current working directory
	const openapiFilePath = path.isAbsolute(openapiPath)
		? openapiPath
		: path.resolve(userDir, openapiPath);

	console.log("Attempting to find OpenAPI file at:", openapiFilePath);

	if (!existsSync(openapiFilePath)) {
		console.log(`OpenAPI file not found at: ${openapiFilePath}`);
		console.log("Creating new openapi.json file...");

		// Ensure directory exists
		const dirPath = path.dirname(openapiFilePath);
		if (!existsSync(dirPath)) {
			console.log(`Creating directory: ${dirPath}`);
			await fs.promises.mkdir(dirPath, { recursive: true });
		}

		const openapiTemplate = baseOpenApiSpec;
		await writeFileSync(
			openapiFilePath,
			JSON.stringify(openapiTemplate, null, 2)
		);
	}
	return openapiFilePath;
}

function isPortAvailable(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const server = net.createServer();
		server.once("error", () => {
			resolve(false);
		});
		server.once("listening", () => {
			server.close();
			resolve(true);
		});
		server.listen(port);
	});
}

async function findAvailablePort(startPort: number): Promise<number> {
	let port = startPort;
	while (!(await isPortAvailable(port))) {
		console.log(`Port ${port} is in use, trying ${port + 1}...`);
		port++;
	}
	return port;
}

async function startServer() {
	// Prompt for OpenAPI path if not provided
	const openAPIPath = await findOpenAPIFile(
		options.openapiPath ??
			process.env.NEXT_PUBLIC_OPENAPI_PATH ??
			(await promptForOpenAPIPath())
	);

	console.log("Using OpenAPI file at:", openAPIPath);

	// Ensure we're using the absolute path
	const absoluteOpenAPIPath = path.resolve(openAPIPath);

	// Check for OpenAI API Key and prompt if not found
	let openaiApiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;
	if (!openaiApiKey) {
		console.log(
			"OpenAI API Key not found in environment variables or command line arguments."
		);
		openaiApiKey = await promptForOpenAIKey();

		if (!openaiApiKey) {
			console.error("OpenAI API Key is required to run Swaggerboy");
			process.exit(1);
		}
	}

	const port = await findAvailablePort(parseInt(options.port));

	try {
		const server = spawn("npx", ["next", "start", "-p", port.toString()], {
			cwd: pkgDir, // Use the package installation directory for Next.js
			env: {
				...process.env,
				NODE_ENV: "development",
				WORKSPACE_ROOT: userDir, // Add this to help resolve paths in the app
				NEXT_PUBLIC_OPENAPI_PATH: absoluteOpenAPIPath,
				PORT: port.toString(),
				API_BASE_URL: options.apiBaseUrl || process.env.API_BASE_URL,
				OPENAI_API_KEY: openaiApiKey,
				OPENAI_ASSISTANT_ID:
					options.openaiAssistantId || process.env.OPENAI_ASSISTANT_ID,
			},
			stdio: "inherit",
		});

		server.on("error", (err) => {
			console.error("Error starting the server", err);
			process.exit(1);
		});

		server.on("exit", (code) => {
			console.log(`Server exited with code ${code}`);
			process.exit(code || 0);
		});

		server.on("spawn", () => {
			console.log(`> Swaggerboy is running on http://localhost:${port}`);
			console.log(`> Using OpenAPI file: ${absoluteOpenAPIPath}`);
		});
	} catch (error) {
		console.error("Error starting the server", error);
		process.exit(1);
	}
}

startServer().catch(console.error);
