import React, { useState } from 'react';
import styles from './AssetTable.module.css';
import { useAssets } from '../context/AssetContext';

const formatCurrency = (val, curr = 'INR') => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: curr,
    maximumFractionDigits: curr === 'INR' ? 0 : 2
  }).format(val);
};

const AssetTable = ({ assets, totalValue, showBondDetails = false, showOwner = false }) => {
  const { updateAsset, deleteAsset } = useAssets();
  const tableTotal = totalValue || assets.reduce((sum, a) => sum + (a.quantity * (a.currentPriceINR || a.currentPrice)), 0);

  const [editAssetId, setEditAssetId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const handleEditClick = (asset) => {
    setEditAssetId(asset.id);
    setEditFormData({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      type: asset.type,
      owner: asset.owner,
      quantity: asset.quantity,
      avgPrice: asset.avgPrice,
      currentPrice: asset.currentPrice,
      maturityDate: asset.maturityDate || '',
      returnRate: asset.returnRate || '',
    });
  };

  const handleSaveClick = async () => {
    const { id, name, symbol, type, owner, maturityDate, returnRate } = editFormData;
    const quantity = Number(editFormData.quantity);
    const avgPrice = Number(editFormData.avgPrice);
    const currentPrice = Number(editFormData.currentPrice);
    if (quantity === 0) {
      await deleteAsset(id);
    } else {
      await updateAsset({ id, name, symbol, type, owner, quantity, avgPrice, currentPrice, maturityDate, returnRate });
    }
    setEditAssetId(null);
  };

  const handleCancelClick = () => {
    setEditAssetId(null);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const inputStyle = {
    padding: '6px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    width: '100%',
    minWidth: '70px',
    fontSize: '0.9rem'
  };

  const btnStyle = {
    padding: '6px 12px',
    borderRadius: '4px',
    background: 'var(--accent-color)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    marginLeft: '4px'
  };

  const cancelBtnStyle = {
    ...btnStyle,
    background: 'rgba(255,255,255,0.1)'
  };

  return (
    <div className={`card ${styles.tableContainer}`}>
      <h3 className={styles.tableTitle}>All Assets</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              {showOwner && <th>Owner</th>}
              <th>Quantity</th>
              <th>Avg Price</th>
              <th>Current Price</th>
              <th>Invested</th>
              <th>Current Value</th>
              <th>Profit/Loss</th>
              <th>Profit %</th>
              {showBondDetails && (
                <>
                  <th>Maturity</th>
                  <th>Return %</th>
                </>
              )}
              <th>Allocation %</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const isEditing = editAssetId === asset.id;
              const displayAsset = isEditing ? editFormData : asset;
              
              // Use INR values for calculations to keep everything consistent with portfolio totals
              const calcInvested = displayAsset.quantity * (displayAsset.avgPriceINR || displayAsset.avgPrice);
              const calcCurrentValue = displayAsset.quantity * (displayAsset.currentPriceINR || displayAsset.currentPrice);
              const calcProfitLoss = calcCurrentValue - calcInvested;

              const invested = displayAsset.invested !== undefined ? displayAsset.invested : calcInvested;
              const currentValue = displayAsset.currentValue !== undefined ? displayAsset.currentValue : calcCurrentValue;
              const profitLoss = displayAsset.profitLoss !== undefined ? displayAsset.profitLoss : calcProfitLoss;
              const profitPercentage = displayAsset.profitPercentage !== undefined ? displayAsset.profitPercentage : (calcInvested > 0 ? (calcProfitLoss / calcInvested) * 100 : 0);
              const allocationPercent = displayAsset.allocationPercent !== undefined ? displayAsset.allocationPercent : (tableTotal > 0 ? (currentValue / tableTotal) * 100 : 0);
              const isProfit = profitLoss >= 0;

              return (
                <tr key={asset.id}>
                  {isEditing ? (
                    <>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                          <input type="text" name="name" value={editFormData.name} onChange={handleChange} style={inputStyle} placeholder="Name" />
                          <input type="text" name="symbol" value={editFormData.symbol} onChange={handleChange} style={inputStyle} placeholder="Symbol" />
                        </div>
                      </td>
                      <td>
                        <input type="text" name="type" value={editFormData.type} onChange={handleChange} style={inputStyle} />
                      </td>
                      {showOwner && (
                        <td>
                          <input type="text" name="owner" value={editFormData.owner} onChange={handleChange} style={inputStyle} />
                        </td>
                      )}
                      <td>
                        <input type="number" name="quantity" value={editFormData.quantity} onChange={handleChange} style={inputStyle} step="any" />
                      </td>
                      <td>
                        <input type="number" name="avgPrice" value={editFormData.avgPrice} onChange={handleChange} style={inputStyle} step="any" />
                      </td>
                      <td>
                        <input type="number" name="currentPrice" value={editFormData.currentPrice} onChange={handleChange} style={inputStyle} step="any" />
                      </td>
                      {/* computed — read only while editing */}
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        {formatCurrency(editFormData.quantity * editFormData.avgPrice, 'INR')}
                      </td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        {formatCurrency(editFormData.quantity * editFormData.currentPrice, 'INR')}
                      </td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        {formatCurrency(editFormData.quantity * editFormData.currentPrice - editFormData.quantity * editFormData.avgPrice, 'INR')}
                      </td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        {editFormData.avgPrice > 0 ? (((editFormData.currentPrice - editFormData.avgPrice) / editFormData.avgPrice) * 100).toFixed(2) : '0.00'}%
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <div className={styles.assetName}>
                          <span className={styles.name}>{asset.name}</span>
                          <span className={styles.symbol}>{asset.symbol}</span>
                        </div>
                      </td>
                      <td><span className={styles.typeBadge}>{asset.type}</span></td>
                      {showOwner && <td>{asset.owner || 'Unknown'}</td>}
                      <td>{asset.quantity}</td>
                      <td>{formatCurrency(asset.avgPrice, asset.currency || 'INR')}</td>
                      <td>{formatCurrency(asset.currentPrice, asset.currency || 'INR')}</td>
                      <td>{formatCurrency(invested, 'INR')}</td>
                      <td>{formatCurrency(currentValue, 'INR')}</td>
                      <td className={isProfit ? 'profit-text' : 'loss-text'}>
                        {isProfit ? '+' : ''}{formatCurrency(profitLoss, 'INR')}
                      </td>
                      <td className={isProfit ? 'profit-text' : 'loss-text'}>
                        {isProfit ? '+' : ''}{Number(profitPercentage).toFixed(2)}%
                      </td>
                    </>
                  )}

                  {showBondDetails && (
                    isEditing ? (
                      <>
                        <td>
                          <input type="text" name="maturityDate" value={editFormData.maturityDate || ''} onChange={handleChange} style={inputStyle} placeholder="YYYY-MM-DD" />
                        </td>
                        <td>
                          <input type="number" name="returnRate" value={editFormData.returnRate || ''} onChange={handleChange} style={inputStyle} step="any" />
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{asset.maturityDate || '-'}</td>
                        <td>{asset.returnRate ? `${asset.returnRate}%` : '-'}</td>
                      </>
                    )
                  )}

                  {isEditing ? (
                    <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                      {tableTotal > 0 ? ((editFormData.quantity * editFormData.currentPrice / tableTotal) * 100).toFixed(2) : '0.00'}%
                    </td>
                  ) : (
                    <td>{Number(allocationPercent).toFixed(2)}%</td>
                  )}

                  <td style={{ whiteSpace: 'nowrap' }}>
                    {isEditing ? (
                      <button onClick={handleSaveClick} style={{ ...btnStyle, background: '#03fc5f', color: '#000', fontWeight: 'bold' }}>Save</button>
                    ) : (
                      <button onClick={() => handleEditClick(asset)} style={cancelBtnStyle}>Edit</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetTable;
