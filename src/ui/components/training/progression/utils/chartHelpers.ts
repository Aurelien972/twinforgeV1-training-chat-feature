/**
 * Chart Helper Utilities
 * Functions for chart data processing and visualization
 */

import type { ChartDataPoint, ChartDimensions, WeeklySessionData } from '../types';
import { CHART_DEFAULTS } from '../config/constants';

/**
 * Calculate chart dimensions with responsive scaling
 */
export function calculateChartDimensions(
  containerWidth: number,
  aspectRatio: number = 2
): ChartDimensions {
  return {
    width: containerWidth,
    height: containerWidth / aspectRatio,
    padding: CHART_DEFAULTS.PADDING,
  };
}

/**
 * Normalize data points to chart coordinates
 */
export function normalizeDataPoints(
  data: ChartDataPoint[],
  dimensions: ChartDimensions
): ChartDataPoint[] {
  if (data.length === 0) return [];
  
  const values = data.map(d => d.y);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  
  const chartWidth = dimensions.width - dimensions.padding.left - dimensions.padding.right;
  const chartHeight = dimensions.height - dimensions.padding.top - dimensions.padding.bottom;
  
  return data.map((point, index) => {
    const x = dimensions.padding.left + (index / (data.length - 1 || 1)) * chartWidth;
    const y = dimensions.padding.top + chartHeight - ((point.y - minValue) / range) * chartHeight;
    
    return {
      ...point,
      x,
      y,
    };
  });
}

/**
 * Generate path string for line chart
 */
export function generateLinePath(points: ChartDataPoint[]): string {
  if (points.length === 0) return '';
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  
  return path;
}

/**
 * Generate smooth curve path using quadratic bezier
 */
export function generateSmoothPath(points: ChartDataPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    const controlY = (current.y + next.y) / 2;
    
    path += ` Q ${current.x} ${current.y}, ${controlX} ${controlY}`;
  }
  
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  
  return path;
}

/**
 * Calculate Y-axis ticks
 */
export function calculateYAxisTicks(
  minValue: number,
  maxValue: number,
  tickCount: number = 5
): number[] {
  const range = maxValue - minValue || 1;
  const step = range / (tickCount - 1);
  
  return Array.from({ length: tickCount }, (_, i) => {
    return minValue + step * i;
  });
}

/**
 * Calculate X-axis ticks for time series
 */
export function calculateXAxisTicks(
  dataPoints: number,
  maxTicks: number = 6
): number[] {
  if (dataPoints <= maxTicks) {
    return Array.from({ length: dataPoints }, (_, i) => i);
  }
  
  const step = Math.ceil(dataPoints / maxTicks);
  const ticks: number[] = [];
  
  for (let i = 0; i < dataPoints; i += step) {
    ticks.push(i);
  }
  
  return ticks;
}

/**
 * Generate grid lines
 */
export function generateGridLines(
  dimensions: ChartDimensions,
  orientation: 'horizontal' | 'vertical',
  count: number
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  
  const chartWidth = dimensions.width - dimensions.padding.left - dimensions.padding.right;
  const chartHeight = dimensions.height - dimensions.padding.top - dimensions.padding.bottom;
  
  if (orientation === 'horizontal') {
    for (let i = 0; i < count; i++) {
      const y = dimensions.padding.top + (i / (count - 1)) * chartHeight;
      lines.push({
        x1: dimensions.padding.left,
        y1: y,
        x2: dimensions.padding.left + chartWidth,
        y2: y,
      });
    }
  } else {
    for (let i = 0; i < count; i++) {
      const x = dimensions.padding.left + (i / (count - 1)) * chartWidth;
      lines.push({
        x1: x,
        y1: dimensions.padding.top,
        x2: x,
        y2: dimensions.padding.top + chartHeight,
      });
    }
  }
  
  return lines;
}

/**
 * Calculate moving average for smoothing
 */
export function calculateMovingAverage(
  data: ChartDataPoint[],
  windowSize: number
): ChartDataPoint[] {
  if (windowSize <= 1) return data;
  
  return data.map((point, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, index + Math.ceil(windowSize / 2));
    const window = data.slice(start, end);
    
    const avgValue = window.reduce((sum, p) => sum + p.value, 0) / window.length;
    
    return {
      ...point,
      value: avgValue,
      y: avgValue,
    };
  });
}

/**
 * Generate heatmap cells
 */
export function generateHeatmapCells(
  data: WeeklySessionData[],
  cellWidth: number,
  cellHeight: number
): Array<{
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  intensity: number;
}> {
  const maxSessions = Math.max(...data.map(d => d.sessionCount), 1);
  
  return data.map(d => {
    return {
      x: d.dayOfWeek * cellWidth,
      y: d.hour * cellHeight,
      width: cellWidth,
      height: cellHeight,
      value: d.sessionCount,
      intensity: d.sessionCount / maxSessions,
    };
  });
}

/**
 * Get color for heatmap cell based on intensity
 */
export function getHeatmapColor(intensity: number, baseColor: string): string {
  if (intensity === 0) return 'rgba(255, 255, 255, 0.05)';
  
  const alpha = 0.2 + (intensity * 0.8);
  return `${baseColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
}

/**
 * Aggregate data by time period
 */
export function aggregateByPeriod(
  data: Array<{ date: Date; value: number }>,
  period: 'day' | 'week' | 'month'
): ChartDataPoint[] {
  const grouped = new Map<string, number[]>();
  
  data.forEach(({ date, value }) => {
    let key: string;
    
    if (period === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(value);
  });
  
  const result: ChartDataPoint[] = [];
  let index = 0;
  
  for (const [label, values] of grouped.entries()) {
    const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;
    result.push({
      x: index++,
      y: avgValue,
      label,
      value: avgValue,
    });
  }
  
  return result;
}
