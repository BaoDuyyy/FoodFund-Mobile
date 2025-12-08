// Generic GraphQL response types - shared across all services

export interface GraphQLError {
    message: string;
    path?: string[];
    extensions?: Record<string, any>;
}

export interface GraphQLResponse<T> {
    data?: T;
    errors?: GraphQLError[];
}
