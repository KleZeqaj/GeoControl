import * as OpenApiValidator from 'express-openapi-validator'

export function validationHandler(yamlPath: string) {
    return OpenApiValidator.middleware({
    apiSpec: yamlPath,
    validateRequests: true, // (default)
    validateResponses: true, // false by default
  })}