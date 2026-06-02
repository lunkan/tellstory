import { Metric } from "../types";

export function sumMetric(metric: Metric, weights: Metric = {}): number {
    const keys = Object.keys(metric);
    const sum = keys.reduce((acc, key) => {
        const weight = weights[key] || 1;
        acc += metric[key] * weight;
        return acc;
    }, 0);

    return sum / Math.max(1, keys.length);
}

export function getSquashedMetric(metrics: Metric[]): Metric {
    const metric: Metric = {};
    for (const value of metrics) {
        Object.keys(value).forEach((key) => {
            metric[key] = (metric[key] || 0) + value[key] / metrics.length; 
        });
    }

    return metric;
}

export function compareMetric(metricA: Metric, metricB: Metric): Metric {
    const metric = {
        ...metricB
    };

    //console.log('#', JSON.stringify(metric, null, 4));
    Object.keys(metricA).forEach((key) => {
        metric[key] = metricB[key] ? Math.abs(metricB[key] - metricA[key]) : metricA[key];
        //console.log('##', metricB[key], ' - ', metricA[key], ' : ', metricB[key] ? Math.abs(metricB[key] - metricA[key]) : metricA[key], ' -- ', metric[key]);
    });

    return metric;
}
