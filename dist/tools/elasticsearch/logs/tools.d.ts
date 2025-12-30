/**
 * Elasticsearch Logs MCP Tools
 *
 * Tools for querying log data from Elasticsearch
 */
import { z } from "zod";
declare const listDataViewsParams: z.ZodObject<{
    filterPattern: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    filterPattern?: string | undefined;
}, {
    filterPattern?: string | undefined;
}>;
declare const getLogFieldsParams: z.ZodObject<{
    fieldType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["keyword", "text", "number", "date", "all"]>>>;
    indexPattern: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fieldType: "number" | "keyword" | "date" | "text" | "all";
    indexPattern: string;
}, {
    indexPattern: string;
    fieldType?: "number" | "keyword" | "date" | "text" | "all" | undefined;
}>;
declare const getFieldValuesParams: z.ZodObject<{
    field: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    startTime: z.ZodString;
    endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    indexPattern: z.ZodString;
}, "strip", z.ZodTypeAny, {
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
declare const searchLogsParams: z.ZodObject<{
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    fields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    query: z.ZodOptional<z.ZodString>;
    startTime: z.ZodString;
    endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    indexPattern: z.ZodString;
}, "strip", z.ZodTypeAny, {
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
declare const getLogContextParams: z.ZodObject<{
    logId: z.ZodString;
    before: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    after: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    indexPattern: z.ZodString;
}, "strip", z.ZodTypeAny, {
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
declare const aggregateLogsParams: z.ZodObject<{
    groupBy: z.ZodString;
    timeInterval: z.ZodOptional<z.ZodString>;
    metric: z.ZodDefault<z.ZodEnum<["count", "avg", "sum", "min", "max"]>>;
    metricField: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    query: z.ZodOptional<z.ZodString>;
    startTime: z.ZodString;
    endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    indexPattern: z.ZodString;
}, "strip", z.ZodTypeAny, {
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
declare const comparePeriodsParams: z.ZodObject<{
    groupBy: z.ZodString;
    period1Start: z.ZodString;
    period1End: z.ZodString;
    period2Start: z.ZodString;
    period2End: z.ZodString;
    metric: z.ZodDefault<z.ZodOptional<z.ZodEnum<["count", "avg", "sum"]>>>;
    metricField: z.ZodOptional<z.ZodString>;
    query: z.ZodOptional<z.ZodString>;
    indexPattern: z.ZodString;
}, "strip", z.ZodTypeAny, {
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
export declare const listDataViewsTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        filterPattern: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        filterPattern?: string | undefined;
    }, {
        filterPattern?: string | undefined;
    }>;
    execute: (args: z.infer<typeof listDataViewsParams>) => Promise<string>;
};
export declare const getLogFieldsTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        fieldType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["keyword", "text", "number", "date", "all"]>>>;
        indexPattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        fieldType: "number" | "keyword" | "date" | "text" | "all";
        indexPattern: string;
    }, {
        indexPattern: string;
        fieldType?: "number" | "keyword" | "date" | "text" | "all" | undefined;
    }>;
    execute: (args: z.infer<typeof getLogFieldsParams>) => Promise<string>;
};
export declare const getFieldValuesTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        field: z.ZodString;
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        indexPattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof getFieldValuesParams>) => Promise<string>;
};
export declare const searchLogsTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        fields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        query: z.ZodOptional<z.ZodString>;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        indexPattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof searchLogsParams>) => Promise<string>;
};
export declare const getLogContextTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        logId: z.ZodString;
        before: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        after: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        indexPattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof getLogContextParams>) => Promise<string>;
};
export declare const aggregateLogsTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        groupBy: z.ZodString;
        timeInterval: z.ZodOptional<z.ZodString>;
        metric: z.ZodDefault<z.ZodEnum<["count", "avg", "sum", "min", "max"]>>;
        metricField: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        query: z.ZodOptional<z.ZodString>;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        indexPattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof aggregateLogsParams>) => Promise<string>;
};
export declare const comparePeriodsTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        groupBy: z.ZodString;
        period1Start: z.ZodString;
        period1End: z.ZodString;
        period2Start: z.ZodString;
        period2End: z.ZodString;
        metric: z.ZodDefault<z.ZodOptional<z.ZodEnum<["count", "avg", "sum"]>>>;
        metricField: z.ZodOptional<z.ZodString>;
        query: z.ZodOptional<z.ZodString>;
        indexPattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof comparePeriodsParams>) => Promise<string>;
};
/**
 * All Logs tools exported as an array
 */
export declare const logsTools: ({
    name: string;
    description: string;
    parameters: z.ZodObject<{
        filterPattern: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        filterPattern?: string | undefined;
    }, {
        filterPattern?: string | undefined;
    }>;
    execute: (args: z.infer<typeof listDataViewsParams>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        fieldType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["keyword", "text", "number", "date", "all"]>>>;
        indexPattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        fieldType: "number" | "keyword" | "date" | "text" | "all";
        indexPattern: string;
    }, {
        indexPattern: string;
        fieldType?: "number" | "keyword" | "date" | "text" | "all" | undefined;
    }>;
    execute: (args: z.infer<typeof getLogFieldsParams>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        field: z.ZodString;
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        indexPattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof getFieldValuesParams>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        fields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        query: z.ZodOptional<z.ZodString>;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        indexPattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof searchLogsParams>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        logId: z.ZodString;
        before: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        after: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        indexPattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof getLogContextParams>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        groupBy: z.ZodString;
        timeInterval: z.ZodOptional<z.ZodString>;
        metric: z.ZodDefault<z.ZodEnum<["count", "avg", "sum", "min", "max"]>>;
        metricField: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        query: z.ZodOptional<z.ZodString>;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        indexPattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof aggregateLogsParams>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        groupBy: z.ZodString;
        period1Start: z.ZodString;
        period1End: z.ZodString;
        period2Start: z.ZodString;
        period2End: z.ZodString;
        metric: z.ZodDefault<z.ZodOptional<z.ZodEnum<["count", "avg", "sum"]>>>;
        metricField: z.ZodOptional<z.ZodString>;
        query: z.ZodOptional<z.ZodString>;
        indexPattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof comparePeriodsParams>) => Promise<string>;
})[];
export {};
//# sourceMappingURL=tools.d.ts.map