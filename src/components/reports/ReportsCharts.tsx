"use client";

import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import type { Order } from '@/types/order';

interface ReportsChartsProps {
    orders: Order[];
}

export default function ReportsCharts({ orders }: ReportsChartsProps) {
    // 1. Prepare Data for Status Pie Chart
    const statusData = [
        { name: 'Completed', value: orders.filter(o => o.status === 'COMPLETED').length, color: '#10b981' },
        { name: 'Cancelled', value: orders.filter(o => o.status === 'CANCELLED').length, color: '#ef4444' },
        { name: 'Active', value: orders.filter(o => ['PENDING', 'COOKING', 'READY'].includes(o.status)).length, color: '#3b82f6' },
    ].filter(item => item.value > 0);

    // 2. Prepare Data for Hourly Activity
    const hourlyMap: Record<string, number> = {};
    orders.forEach(o => {
        const hour = new Date(o.createdAt).getHours();
        const label = `${hour}:00`;
        hourlyMap[label] = (hourlyMap[label] || 0) + 1;
    });

    const hourlyData = Object.entries(hourlyMap)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            
            {/* HOURLY ACTIVITY CHART */}
            <div className="bg-[#111118] p-6 rounded-2xl border border-zinc-800 shadow-xl">
                <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Kitchen Activity Trends
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyData}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                            <XAxis 
                                dataKey="hour" 
                                stroke="#6b7280" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <YAxis 
                                stroke="#6b7280" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#111118', border: '1px solid #374151', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="count" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorCount)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* STATUS DISTRIBUTION CHART */}
            <div className="bg-[#111118] p-6 rounded-2xl border border-zinc-800 shadow-xl">
                <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                    Order Status Breakdown
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#111118', border: '1px solid #374151', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
