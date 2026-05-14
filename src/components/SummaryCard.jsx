import React from 'react';
import styles from './SummaryCard.module.css';
import { TrendingUp, TrendingDown } from 'lucide-react';

const SummaryCard = ({ title, value, prefix = '₹', isPercentage = false, subtitle, dynamicColor = false }) => {
  const isProfit = value >= 0;
  const isNeutral = value === 0;
  
  const formattedValue = isPercentage 
    ? `${Math.abs(value).toFixed(2)}%`
    : `${Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className={`card ${styles.summaryCard}`}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.valueContainer}>
        <span 
          className={`${styles.value} ${dynamicColor && !isNeutral ? (isProfit ? 'profit-text' : 'loss-text') : ''}`}
          style={isPercentage ? { fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '8px' } : {}}
        >
          {isPercentage && !isNeutral && (isProfit ? <TrendingUp size={36} /> : <TrendingDown size={36} />)}
          {!isPercentage && prefix}
          {formattedValue}
        </span>
        {subtitle && !isPercentage && (
          <span className={`${styles.subtitle} ${isNeutral ? '' : isProfit ? 'profit-text' : 'loss-text'}`}>
            {!isNeutral && (isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />)}
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
