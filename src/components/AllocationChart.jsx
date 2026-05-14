import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

const AllocationChart = ({ data, title }) => {
  return (
    <div className="card">
      <h3 style={{ margin: '0 0 24px 0', fontSize: '1.1rem', color: '#f0f0f0' }}>{title || 'Asset Allocation'}</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              key={title}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={110}
              dataKey="value"
              stroke="#0c0c0c"
              strokeWidth={1}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const total = data.reduce((sum, item) => sum + item.value, 0);
                const percent = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
                return [`${percent}% (${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)})`, name];
              }}
              contentStyle={{ backgroundColor: 'rgba(20, 20, 19, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AllocationChart;
