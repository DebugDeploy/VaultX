import React from 'react';
import { Lightbulb, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

const AIInsights = ({ assets }) => {
  // Simple AI analysis mock based on assets
  const insights = [];
  
  // Calculate total values
  let totalValue = 0;
  const categoryTotals = {};
  
  assets.forEach(asset => {
    const value = asset.quantity * asset.currentPrice;
    totalValue += value;
    categoryTotals[asset.type] = (categoryTotals[asset.type] || 0) + value;
  });
  
  const highRiskCategories = ['Crypto', 'Stocks'];
  let highRiskTotal = 0;
  
  highRiskCategories.forEach(cat => {
    if (categoryTotals[cat]) highRiskTotal += categoryTotals[cat];
  });
  
  const highRiskPercentage = totalValue > 0 ? (highRiskTotal / totalValue) * 100 : 0;
  
  // Insight 1: Risk Assessment
  if (highRiskPercentage > 60) {
    insights.push({
      type: 'warning',
      icon: <AlertTriangle size={18} color="#f59e0b" />,
      text: `Your portfolio is ${highRiskPercentage.toFixed(0)}% high-risk. Consider diversification into Bonds or ETFs to balance volatility.`
    });
  } else if (highRiskPercentage < 20) {
    insights.push({
      type: 'info',
      icon: <Lightbulb size={18} color="var(--accent-color)" />,
      text: `Your portfolio is highly conservative. You might be missing out on growth opportunities in Stocks or Crypto.`
    });
  } else {
    insights.push({
      type: 'success',
      icon: <CheckCircle size={18} color="var(--profit)" />,
      text: `Your portfolio risk is well-balanced across asset classes.`
    });
  }
  
  // Insight 2: Performance
  let profitTotal = 0;
  assets.forEach(asset => {
    profitTotal += (asset.quantity * asset.currentPrice) - (asset.quantity * asset.avgPrice);
  });
  
  if (profitTotal > 0) {
    insights.push({
      type: 'success',
      icon: <TrendingUp size={18} color="var(--profit)" />,
      text: `Great job! Your portfolio is generating positive returns. Continue holding your strong performers.`
    });
  } else {
    insights.push({
      type: 'warning',
      icon: <Lightbulb size={18} color="#f59e0b" />,
      text: `Your portfolio is currently underperforming. Consider re-evaluating your recent investments.`
    });
  }
  
  // Insight 3: Overbought Check (Mock)
  const cryptoAssets = assets.filter(a => a.type === 'Crypto');
  if (cryptoAssets.length > 0 && cryptoAssets.some(c => c.currentPrice > c.avgPrice * 1.5)) {
    insights.push({
      type: 'warning',
      icon: <Lightbulb size={18} color="#f59e0b" />,
      text: `Some Crypto assets have rallied significantly. It might be a good time to take some profits.`
    });
  }

  return (
    <div className="card" style={{ marginBottom: '32px' }}>
      <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
        <Lightbulb size={20} color="var(--accent-color)" />
        AI Portfolio Insights
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {insights.map((insight, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '12px', 
            background: 'rgba(255,255,255,0.03)', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ marginTop: '2px' }}>{insight.icon}</div>
            <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.4' }}>
              {insight.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIInsights;
