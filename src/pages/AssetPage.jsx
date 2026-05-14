import React, { useMemo } from 'react';
import SummaryCard from '../components/SummaryCard';
import AllocationChart from '../components/AllocationChart';
import PerformanceChart from '../components/PerformanceChart';
import AssetTable from '../components/AssetTable';
import { useAssets } from '../context/AssetContext';
import { calculateSummary, getOwnerAllocationData } from '../utils/portfolioUtils';

const AssetPage = ({ type }) => {
  const { assets, activePortfolio, portfolioMembers } = useAssets();
  const filteredAssets = useMemo(() => assets.filter(a => a.type === type), [assets, type]);
  const summary = useMemo(() => calculateSummary(assets, type), [assets, type]);

  // Custom allocation just for this type (e.g., breakdown by specific asset)
  const allocationData = useMemo(() => {
    return filteredAssets.map(asset => ({
      name: asset.name || asset.symbol,
      value: asset.quantity * asset.currentPrice
    }));
  }, [filteredAssets]);

  const ownerAllocationData = useMemo(() => getOwnerAllocationData(filteredAssets), [filteredAssets]);

  const isCombined = activePortfolio === 'combined';
  const portfolioTitle = useMemo(() => {
    if (isCombined) return `Combined ${type}`;
    const member = portfolioMembers.find(m => m.uid === activePortfolio);
    return member ? `${member.name}'s ${type}` : type;
  }, [activePortfolio, portfolioMembers, isCombined, type]);

  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>{portfolioTitle}</h1>

      <div className="dashboard-grid">
        <SummaryCard
          title="Total Invested"
          value={summary.totalInvested}
        />
        <SummaryCard
          title="Current Value"
          value={summary.currentValue}
        />
        <SummaryCard
          title={summary.profitLoss >= 0 ? "Total Profit" : "Total Loss"}
          value={summary.profitLoss}
          dynamicColor={true}
        />
        <SummaryCard
          title="Return on Investment"
          value={summary.profitPercentage}
          isPercentage={true}
          dynamicColor={true}
        />
      </div>

      <div className="charts-grid" style={{
        display: 'grid',
        gridTemplateColumns: isCombined ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {isCombined && (
          <AllocationChart data={ownerAllocationData} title="Member Allocation" />
        )}
        <AllocationChart data={allocationData} title={`${type} Allocation`} />
        <PerformanceChart title={`${type} Performance`} />
      </div>

      <AssetTable
        assets={filteredAssets}
        totalValue={summary.currentValue}
        showBondDetails={type === 'Bonds'}
        showOwner={isCombined}
      />
    </div>
  );
};

export default AssetPage;
