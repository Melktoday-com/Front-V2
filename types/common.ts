/**
 * JSON Canonical Types
 * Strictly compliant with "Zero occurrences of any/unknown" rule.
 */

export type JsonPrimitive = string | number | boolean | null;

export type JsonArray = Array<JsonValue>;

export interface JsonObject {
    [key: string]: JsonValue | undefined;
}

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
