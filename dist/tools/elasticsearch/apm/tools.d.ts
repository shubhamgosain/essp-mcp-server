/**
 * Elasticsearch APM MCP Tools
 *
 * Tools for querying APM data from Elasticsearch
 */
import { z } from "zod";
declare const apmHealthCheckParams: z.ZodObject<{
    apmIndex: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    apmIndex?: string | undefined;
}, {
    apmIndex?: string | undefined;
}>;
declare const listApmServicesParams: z.ZodObject<{
    startTime: z.ZodString;
    endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    apmIndex: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startTime: string;
    endTime: string;
    apmIndex?: string | undefined;
}, {
    startTime: string;
    apmIndex?: string | undefined;
    endTime?: string | undefined;
}>;
declare const getTransactionsParams: z.ZodObject<{
    serviceName: z.ZodString;
    transactionType: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    startTime: z.ZodString;
    endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    apmIndex: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
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
declare const getErrorsParams: z.ZodObject<{
    serviceName: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    startTime: z.ZodString;
    endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    apmIndex: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
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
declare const getTraceParams: z.ZodObject<{
    traceId: z.ZodString;
    apmIndex: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    traceId: string;
    apmIndex?: string | undefined;
}, {
    traceId: string;
    apmIndex?: string | undefined;
}>;
declare const getLatencyStatsParams: z.ZodObject<{
    serviceName: z.ZodString;
    transactionType: z.ZodOptional<z.ZodString>;
    startTime: z.ZodString;
    endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    apmIndex: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
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
declare const getErrorRateParams: z.ZodObject<{
    serviceName: z.ZodString;
    startTime: z.ZodString;
    endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    apmIndex: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
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
declare const searchApmParams: z.ZodObject<{
    query: z.ZodString;
    apmIndex: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query: string;
    apmIndex?: string | undefined;
}, {
    query: string;
    apmIndex?: string | undefined;
}>;
export declare const apmHealthCheckTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        apmIndex?: string | undefined;
    }, {
        apmIndex?: string | undefined;
    }>;
    execute: (args: z.infer<typeof apmHealthCheckParams>) => Promise<string>;
};
export declare const listApmServicesTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        startTime: string;
        endTime: string;
        apmIndex?: string | undefined;
    }, {
        startTime: string;
        apmIndex?: string | undefined;
        endTime?: string | undefined;
    }>;
    execute: (args: z.infer<typeof listApmServicesParams>) => Promise<string>;
};
export declare const getTransactionsTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        serviceName: z.ZodString;
        transactionType: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof getTransactionsParams>) => Promise<string>;
};
export declare const getErrorsTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        serviceName: z.ZodString;
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof getErrorsParams>) => Promise<string>;
};
export declare const getTraceTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        traceId: z.ZodString;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        traceId: string;
        apmIndex?: string | undefined;
    }, {
        traceId: string;
        apmIndex?: string | undefined;
    }>;
    execute: (args: z.infer<typeof getTraceParams>) => Promise<string>;
};
export declare const getLatencyStatsTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        serviceName: z.ZodString;
        transactionType: z.ZodOptional<z.ZodString>;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof getLatencyStatsParams>) => Promise<string>;
};
export declare const getErrorRateTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        serviceName: z.ZodString;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof getErrorRateParams>) => Promise<string>;
};
export declare const searchApmTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        query: z.ZodString;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        apmIndex?: string | undefined;
    }, {
        query: string;
        apmIndex?: string | undefined;
    }>;
    execute: (args: z.infer<typeof searchApmParams>) => Promise<string>;
};
/**
 * All APM tools exported as an array
 */
export declare const apmTools: ({
    name: string;
    description: string;
    parameters: z.ZodObject<{
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        apmIndex?: string | undefined;
    }, {
        apmIndex?: string | undefined;
    }>;
    execute: (args: z.infer<typeof apmHealthCheckParams>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        startTime: string;
        endTime: string;
        apmIndex?: string | undefined;
    }, {
        startTime: string;
        apmIndex?: string | undefined;
        endTime?: string | undefined;
    }>;
    execute: (args: z.infer<typeof listApmServicesParams>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        serviceName: z.ZodString;
        transactionType: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof getTransactionsParams>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        serviceName: z.ZodString;
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof getErrorsParams>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        traceId: z.ZodString;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        traceId: string;
        apmIndex?: string | undefined;
    }, {
        traceId: string;
        apmIndex?: string | undefined;
    }>;
    execute: (args: z.infer<typeof getTraceParams>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        serviceName: z.ZodString;
        transactionType: z.ZodOptional<z.ZodString>;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof getLatencyStatsParams>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        serviceName: z.ZodString;
        startTime: z.ZodString;
        endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
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
    execute: (args: z.infer<typeof getErrorRateParams>) => Promise<string>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        query: z.ZodString;
        apmIndex: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        apmIndex?: string | undefined;
    }, {
        query: string;
        apmIndex?: string | undefined;
    }>;
    execute: (args: z.infer<typeof searchApmParams>) => Promise<string>;
})[];
export {};
//# sourceMappingURL=tools.d.ts.map