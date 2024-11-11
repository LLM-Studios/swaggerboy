import { z } from 'zod'

// Helper schemas
const nonEmptyString = z.string().min(1)
const nonEmptyStringArray = z.array(nonEmptyString).min(1)

// Reference Object
export const ReferenceObject = z.object({
	$ref: nonEmptyString,
})

// Server Object
export const ServerObject = z.object({
	url: nonEmptyString,
	description: z.string().optional(),
	variables: z
		.record(
			z.object({
				enum: z.array(nonEmptyString).optional(),
				default: z.string(),
				description: z.string().optional(),
			})
		)
		.optional(),
})

// External Documentation Object
export const ExternalDocumentationObject = z.object({
	description: z.string().optional(),
	url: nonEmptyString,
})

// Schema Object (simplified, as full implementation would be recursive)
export const SchemaObject = z
	.object({
		type: z.enum([
			'string',
			'number',
			'integer',
			'boolean',
			'array',
			'object',
		]),
		format: z.string().optional(),
		// Add other properties as needed
	})
	.passthrough()

// Example Object
export const ExampleObject = z.object({
	summary: z.string().optional(),
	description: z.string().optional(),
	value: z.any().optional(),
	externalValue: z.string().url().optional(),
})

// Parameter Object
export const ParameterObject = z.object({
	name: nonEmptyString,
	in: z.enum(['query', 'header', 'path', 'cookie']),
	description: z.string().optional(),
	required: z.boolean().optional(),
	deprecated: z.boolean().optional(),
	allowEmptyValue: z.boolean().optional(),
})

// Request Body Object
export const RequestBodyObject = z.object({
	description: z.string().optional(),
	content: z.record(
		nonEmptyString,
		z.object({
			schema: ReferenceObject,
			examples: z
				.record(
					nonEmptyString,
					z.union([ExampleObject, ReferenceObject])
				)
				.optional(),
		})
	),
	required: z.boolean().optional(),
})

// Response Object
export const ResponseObject = z.object({
	description: nonEmptyString,
	headers: z.record(nonEmptyString, ReferenceObject).optional(),
	content: z
		.record(
			nonEmptyString,
			z.object({
				schema: ReferenceObject,
				examples: z
					.record(
						nonEmptyString,
						z.union([ExampleObject, ReferenceObject])
					)
					.optional(),
			})
		)
		.optional(),
})

// Operation Object
export const OperationObject = z.object({
	tags: nonEmptyStringArray,
	summary: z.string(),
	description: z.string(),
	operationId: nonEmptyString,
	parameters: z.array(ReferenceObject).optional(),
	requestBody: z.union([ReferenceObject, RequestBodyObject]).optional(),
	responses: z.record(
		z.union([
			z.literal('default'),
			z.string().regex(/^[1-5](?:\d{2}|\dX)$/),
		]),
		z.union([ResponseObject, ReferenceObject])
	),
	'x-implementation-details': z.string().optional(),
})

// Path Item Object
export const PathItemObject = z.object({
	summary: z.string().optional(),
	description: z.string().optional(),
	get: OperationObject.optional(),
	put: OperationObject.optional(),
	post: OperationObject.optional(),
	delete: OperationObject.optional(),
	options: OperationObject.optional(),
	head: OperationObject.optional(),
	patch: OperationObject.optional(),
	trace: OperationObject.optional(),
	servers: z.array(ServerObject).optional(),
	parameters: z.array(ReferenceObject).optional(),
})

// Components Object
export const ComponentsObject = z.object({
	schemas: z
		.record(nonEmptyString, z.union([SchemaObject, ReferenceObject]))
		.optional(),
	responses: z
		.record(nonEmptyString, z.union([ResponseObject, ReferenceObject]))
		.optional(),
	parameters: z
		.record(nonEmptyString, z.union([ParameterObject, ReferenceObject]))
		.optional(),
	examples: z
		.record(nonEmptyString, z.union([ExampleObject, ReferenceObject]))
		.optional(),
	requestBodies: z
		.record(nonEmptyString, z.union([RequestBodyObject, ReferenceObject]))
		.optional(),
})

export const HeaderObject = z.record(nonEmptyString, ReferenceObject).optional()

// Info Object
export const InfoObject = z.object({
	title: nonEmptyString,
	description: z.string(),
	termsOfService: z.string().url().optional(),
	contact: z
		.object({
			name: z.string().optional(),
			url: z.string().url().optional(),
			email: z.string().email().optional(),
		})
		.optional(),
	license: z
		.object({
			name: nonEmptyString,
			identifier: z.string().optional(),
			url: z.string().url().optional(),
		})
		.optional(),
	version: nonEmptyString,
})

// OpenAPI Object
export const OpenAPIObject = z.object({
	openapi: z.literal('3.1.0'),
	info: InfoObject,
	servers: z.array(ServerObject).optional(),
	paths: z.record(z.string().regex(/^\//), PathItemObject).optional(),
	components: ComponentsObject.optional(),
	tags: z
		.array(
			z.object({
				name: nonEmptyString,
				description: z.string().optional(),
			})
		)
		.optional(),
})

export const OpenAPISchema = OpenAPIObject
