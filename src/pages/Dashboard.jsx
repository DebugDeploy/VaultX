import React, { useMemo } from 'react';
import SummaryCard from '../components/SummaryCard';
import AllocationChart from '../components/AllocationChart';
import PerformanceChart from '../components/PerformanceChart';
import AssetTable from '../components/AssetTable';
import AIInsights from '../components/AIInsights';
import { useAssets } from '../context/AssetContext';
import { calculateSummary, getAllocationData, getOwnerAllocationData } from '../utils/portfolioUtils';

const Dashboard = () => {
  const { assets, activePortfolio, portfolioMembers } = useAssets();

  const summary          = useMemo(() => calculateSummary(assets), [assets]);
  const allocationData   = useMemo(() => getAllocationData(assets), [assets]);
  const ownerAllocationData = useMemo(() => getOwnerAllocationData(assets), [assets]);

  const portfolioTitle = useMemo(() => {
    if (activePortfolio === 'combined') return 'Combined Overview';
    const member = portfolioMembers.find(m => m.uid === activePortfolio);
    return member ? `${member.name}'s Portfolio` : 'Portfolio';
  }, [activePortfolio, portfolioMembers]);

  const isCombined = activePortfolio === 'combined';

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>{portfolioTitle}</h1>
      </div>

      <div className="dashboard-grid">
        <SummaryCard title="Total Invested"    value={summary.totalInvested} />
        <SummaryCard title="Current Value"     value={summary.currentValue} />
        <SummaryCard title={summary.profitLoss >= 0 ? 'Total Profit' : 'Total Loss'} value={summary.profitLoss} dynamicColor />
        <SummaryCard title="Return on Investment" value={summary.profitPercentage} isPercentage dynamicColor />
      </div>

      <div className="charts-grid" style={{
        display: 'grid',
        gridTemplateColumns: isCombined ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
        gap: '24px',
        marginBottom: '24px',
      }}>
        {isCombined && <AllocationChart data={ownerAllocationData} title="Member Allocation" />}
        <AllocationChart data={allocationData} title="Asset Class Allocation" />
        <PerformanceChart />
      </div>

      <AIInsights assets={assets} />

      <AssetTable assets={assets} totalValue={summary.currentValue} showOwner={isCombined} />
    </div>
  );
};

export default Dashboard;
