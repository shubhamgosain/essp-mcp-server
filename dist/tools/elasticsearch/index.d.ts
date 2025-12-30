/**
 * Elasticsearch Tools Module
 *
 * Exports all Elasticsearch-related MCP tools (APM and Logs)
 */
export * from "./common/index.js";
export * from "./apm/index.js";
export * from "./logs/index.js";
import { apmTools } from "./apm/tools.js";
import { logsTools } from "./logs/tools.js";
/**
 * All Elasticsearch tools (APM + Logs)
 */
export declare const elasticsearchTools: ({
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        apmIndex?: string | undefined;
    }, {
        apmIndex?: string | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        apmIndex?: string | undefined;
    }, {
        apmIndex?: string | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        apmIndex?: string | undefined;
    }, {
        startTime: string;
        apmIndex?: string | undefined;
        endTime?: string | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        apmIndex?: string | undefined;
    }, {
        startTime: string;
        apmIndex?: string | undefined;
        endTime?: string | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        serviceName: import("zod").ZodString;
        transactionType: import("zod").ZodOptional<import("zod").ZodString>;
        limit: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        serviceName: string;
        limit: number;
        apmIndex?: string | undefined;
        transactionType?: string | undefined;
    }, {
        startTime: string;
        serviceName: string;
        apmIndex?: string | undefined;
        endTime?: string | undefined;
        transactionType?: string | undefined;
        limit?: number | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        serviceName: import("zod").ZodString;
        transactionType: import("zod").ZodOptional<import("zod").ZodString>;
        limit: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        serviceName: string;
        limit: number;
        apmIndex?: string | undefined;
        transactionType?: string | undefined;
    }, {
        startTime: string;
        serviceName: string;
        apmIndex?: string | undefined;
        endTime?: string | undefined;
        transactionType?: string | undefined;
        limit?: number | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        serviceName: import("zod").ZodString;
        limit: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        serviceName: string;
        limit: number;
        apmIndex?: string | undefined;
    }, {
        startTime: string;
        serviceName: string;
        apmIndex?: string | undefined;
        endTime?: string | undefined;
        limit?: number | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        serviceName: import("zod").ZodString;
        limit: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        serviceName: string;
        limit: number;
        apmIndex?: string | undefined;
    }, {
        startTime: string;
        serviceName: string;
        apmIndex?: string | undefined;
        endTime?: string | undefined;
        limit?: number | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        traceId: import("zod").ZodString;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        traceId: string;
        apmIndex?: string | undefined;
    }, {
        traceId: string;
        apmIndex?: string | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        traceId: import("zod").ZodString;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        traceId: string;
        apmIndex?: string | undefined;
    }, {
        traceId: string;
        apmIndex?: string | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        serviceName: import("zod").ZodString;
        transactionType: import("zod").ZodOptional<import("zod").ZodString>;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        serviceName: string;
        apmIndex?: string | undefined;
        transactionType?: string | undefined;
    }, {
        startTime: string;
        serviceName: string;
        apmIndex?: string | undefined;
        endTime?: string | undefined;
        transactionType?: string | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        serviceName: import("zod").ZodString;
        transactionType: import("zod").ZodOptional<import("zod").ZodString>;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        serviceName: string;
        apmIndex?: string | undefined;
        transactionType?: string | undefined;
    }, {
        startTime: string;
        serviceName: string;
        apmIndex?: string | undefined;
        endTime?: string | undefined;
        transactionType?: string | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        serviceName: import("zod").ZodString;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        serviceName: string;
        apmIndex?: string | undefined;
    }, {
        startTime: string;
        serviceName: string;
        apmIndex?: string | undefined;
        endTime?: string | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        serviceName: import("zod").ZodString;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        serviceName: string;
        apmIndex?: string | undefined;
    }, {
        startTime: string;
        serviceName: string;
        apmIndex?: string | undefined;
        endTime?: string | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        query: import("zod").ZodString;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        query: string;
        apmIndex?: string | undefined;
    }, {
        query: string;
        apmIndex?: string | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        query: import("zod").ZodString;
        apmIndex: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        query: string;
        apmIndex?: string | undefined;
    }, {
        query: string;
        apmIndex?: string | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        filterPattern: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        filterPattern?: string | undefined;
    }, {
        filterPattern?: string | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        filterPattern: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        filterPattern?: string | undefined;
    }, {
        filterPattern?: string | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        fieldType: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["keyword", "text", "number", "date", "all"]>>>;
        indexPattern: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        fieldType: "number" | "keyword" | "date" | "text" | "all";
        indexPattern: string;
    }, {
        indexPattern: string;
        fieldType?: "number" | "keyword" | "date" | "text" | "all" | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        fieldType: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["keyword", "text", "number", "date", "all"]>>>;
        indexPattern: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        fieldType: "number" | "keyword" | "date" | "text" | "all";
        indexPattern: string;
    }, {
        indexPattern: string;
        fieldType?: "number" | "keyword" | "date" | "text" | "all" | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        field: import("zod").ZodString;
        limit: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        indexPattern: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        limit: number;
        indexPattern: string;
        field: string;
    }, {
        startTime: string;
        indexPattern: string;
        field: string;
        endTime?: string | undefined;
        limit?: number | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        field: import("zod").ZodString;
        limit: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        indexPattern: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        limit: number;
        indexPattern: string;
        field: string;
    }, {
        startTime: string;
        indexPattern: string;
        field: string;
        endTime?: string | undefined;
        limit?: number | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        limit: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        fields: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        query: import("zod").ZodOptional<import("zod").ZodString>;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        indexPattern: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        limit: number;
        indexPattern: string;
        query?: string | undefined;
        fields?: string[] | undefined;
    }, {
        startTime: string;
        indexPattern: string;
        endTime?: string | undefined;
        limit?: number | undefined;
        query?: string | undefined;
        fields?: string[] | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        limit: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        fields: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
        query: import("zod").ZodOptional<import("zod").ZodString>;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        indexPattern: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        limit: number;
        indexPattern: string;
        query?: string | undefined;
        fields?: string[] | undefined;
    }, {
        startTime: string;
        indexPattern: string;
        endTime?: string | undefined;
        limit?: number | undefined;
        query?: string | undefined;
        fields?: string[] | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        logId: import("zod").ZodString;
        before: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        after: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        indexPattern: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        before: number;
        after: number;
        indexPattern: string;
        logId: string;
    }, {
        indexPattern: string;
        logId: string;
        before?: number | undefined;
        after?: number | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        logId: import("zod").ZodString;
        before: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        after: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        indexPattern: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        before: number;
        after: number;
        indexPattern: string;
        logId: string;
    }, {
        indexPattern: string;
        logId: string;
        before?: number | undefined;
        after?: number | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        groupBy: import("zod").ZodString;
        timeInterval: import("zod").ZodOptional<import("zod").ZodString>;
        metric: import("zod").ZodDefault<import("zod").ZodEnum<["count", "avg", "sum", "min", "max"]>>;
        metricField: import("zod").ZodOptional<import("zod").ZodString>;
        limit: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        query: import("zod").ZodOptional<import("zod").ZodString>;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        indexPattern: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        limit: number;
        indexPattern: string;
        groupBy: string;
        metric: "avg" | "max" | "count" | "sum" | "min";
        query?: string | undefined;
        timeInterval?: string | undefined;
        metricField?: string | undefined;
    }, {
        startTime: string;
        indexPattern: string;
        groupBy: string;
        endTime?: string | undefined;
        limit?: number | undefined;
        query?: string | undefined;
        timeInterval?: string | undefined;
        metric?: "avg" | "max" | "count" | "sum" | "min" | undefined;
        metricField?: string | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        groupBy: import("zod").ZodString;
        timeInterval: import("zod").ZodOptional<import("zod").ZodString>;
        metric: import("zod").ZodDefault<import("zod").ZodEnum<["count", "avg", "sum", "min", "max"]>>;
        metricField: import("zod").ZodOptional<import("zod").ZodString>;
        limit: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        query: import("zod").ZodOptional<import("zod").ZodString>;
        startTime: import("zod").ZodString;
        endTime: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodString>>;
        indexPattern: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        startTime: string;
        endTime: string;
        limit: number;
        indexPattern: string;
        groupBy: string;
        metric: "avg" | "max" | "count" | "sum" | "min";
        query?: string | undefined;
        timeInterval?: string | undefined;
        metricField?: string | undefined;
    }, {
        startTime: string;
        indexPattern: string;
        groupBy: string;
        endTime?: string | undefined;
        limit?: number | undefined;
        query?: string | undefined;
        timeInterval?: string | undefined;
        metric?: "avg" | "max" | "count" | "sum" | "min" | undefined;
        metricField?: string | undefined;
    }>>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: import("zod").ZodObject<{
        groupBy: import("zod").ZodString;
        period1Start: import("zod").ZodString;
        period1End: import("zod").ZodString;
        period2Start: import("zod").ZodString;
        period2End: import("zod").ZodString;
        metric: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["count", "avg", "sum"]>>>;
        metricField: import("zod").ZodOptional<import("zod").ZodString>;
        query: import("zod").ZodOptional<import("zod").ZodString>;
        indexPattern: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        indexPattern: string;
        groupBy: string;
        metric: "avg" | "count" | "sum";
        period1Start: string;
        period1End: string;
        period2Start: string;
        period2End: string;
        query?: string | undefined;
        metricField?: string | undefined;
    }, {
        indexPattern: string;
        groupBy: string;
        period1Start: string;
        period1End: string;
        period2Start: string;
        period2End: string;
        query?: string | undefined;
        metric?: "avg" | "count" | "sum" | undefined;
        metricField?: string | undefined;
    }>;
    execute: (args: import("zod").TypeOf<import("zod").ZodObject<{
        groupBy: import("zod").ZodString;
        period1Start: import("zod").ZodString;
        period1End: import("zod").ZodString;
        period2Start: import("zod").ZodString;
        period2End: import("zod").ZodString;
        metric: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["count", "avg", "sum"]>>>;
        metricField: import("zod").ZodOptional<import("zod").ZodString>;
        query: import("zod").ZodOptional<import("zod").ZodString>;
        indexPattern: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        indexPattern: string;
        groupBy: string;
        metric: "avg" | "count" | "sum";
        period1Start: string;
        period1End: string;
        period2Start: string;
        period2End: string;
        query?: string | undefined;
        metricField?: string | undefined;
    }, {
        indexPattern: string;
        groupBy: string;
        period1Start: string;
        period1End: string;
        period2Start: string;
        period2End: string;
        query?: string | undefined;
        metric?: "avg" | "count" | "sum" | undefined;
        metricField?: string | undefined;
    }>>) => Promise<string>;
})[];
/**
 * APM tools only
 */
export { apmTools };
/**
 * Logs tools only
 */
export { logsTools };
//# sourceMappingURL=index.d.ts.map