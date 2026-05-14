import React, { useState, useMemo } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import { useAssets } from '../context/AssetContext';

// ── Curated ticker reference ──────────────────────────────────────────────────
// Organised by asset type so the search is contextual.
const TICKER_SUGGESTIONS = {
  Stocks: [
    // Indian NSE
    { name: 'Reliance Industries',   symbol: 'RELIANCE.NS' },
    { name: 'TCS',                   symbol: 'TCS.NS' },
    { name: 'Infosys',               symbol: 'INFY.NS' },
    { name: 'HDFC Bank',             symbol: 'HDFCBANK.NS' },
    { name: 'ICICI Bank',            symbol: 'ICICIBANK.NS' },
    { name: 'State Bank of India',   symbol: 'SBIN.NS' },
    { name: 'Wipro',                 symbol: 'WIPRO.NS' },
    { name: 'HCL Technologies',      symbol: 'HCLTECH.NS' },
    { name: 'Bajaj Finance',         symbol: 'BAJFINANCE.NS' },
    { name: 'Maruti Suzuki',         symbol: 'MARUTI.NS' },
    { name: 'Asian Paints',          symbol: 'ASIANPAINT.NS' },
    { name: 'Titan Company',         symbol: 'TITAN.NS' },
    { name: 'Larsen & Toubro',       symbol: 'LT.NS' },
    { name: 'Kotak Mahindra Bank',   symbol: 'KOTAKBANK.NS' },
    { name: 'Axis Bank',             symbol: 'AXISBANK.NS' },
    { name: 'Bharti Airtel',         symbol: 'BHARTIARTL.NS' },
    { name: 'Sun Pharma',            symbol: 'SUNPHARMA.NS' },
    { name: 'UltraTech Cement',      symbol: 'ULTRACEMCO.NS' },
    { name: 'ITC Limited',           symbol: 'ITC.NS' },
    { name: 'Hindustan Unilever',    symbol: 'HINDUNILVR.NS' },
    { name: 'Adani Enterprises',     symbol: 'ADANIENT.NS' },
    { name: 'Power Grid Corp',       symbol: 'POWERGRID.NS' },
    { name: 'NTPC Limited',          symbol: 'NTPC.NS' },
    { name: 'Tata Motors',           symbol: 'TATAMOTORS.NS' },
    { name: 'Tata Steel',            symbol: 'TATASTEEL.NS' },
    { name: 'ONGC',                  symbol: 'ONGC.NS' },
    { name: 'Nestle India',          symbol: 'NESTLEIND.NS' },
    { name: 'Divis Laboratories',    symbol: 'DIVISLAB.NS' },
    { name: 'Bajaj Auto',            symbol: 'BAJAJ-AUTO.NS' },
    { name: 'Tech Mahindra',         symbol: 'TECHM.NS' },
    { name: 'Dr. Reddys Labs',       symbol: 'DRREDDY.NS' },
    { name: 'Cipla',                 symbol: 'CIPLA.NS' },
    { name: 'Eicher Motors',         symbol: 'EICHERMOT.NS' },
    { name: 'Hindalco',              symbol: 'HINDALCO.NS' },
    { name: 'JSW Steel',             symbol: 'JSWSTEEL.NS' },
    // Global
    { name: 'Apple Inc.',            symbol: 'AAPL' },
    { name: 'Microsoft',             symbol: 'MSFT' },
    { name: 'NVIDIA',                symbol: 'NVDA' },
    { name: 'Amazon',                symbol: 'AMZN' },
    { name: 'Alphabet (Google)',      symbol: 'GOOGL' },
    { name: 'Meta Platforms',        symbol: 'META' },
    { name: 'Tesla',                 symbol: 'TSLA' },
    { name: 'Berkshire Hathaway',    symbol: 'BRK-B' },
    { name: 'JPMorgan Chase',        symbol: 'JPM' },
    { name: 'Samsung Electronics',   symbol: '005930.KS' },
  ],
  Crypto: [
    { name: 'Bitcoin',              symbol: 'BTC-USD' },
    { name: 'Ethereum',             symbol: 'ETH-USD' },
    { name: 'Solana',               symbol: 'SOL-USD' },
    { name: 'BNB',                  symbol: 'BNB-USD' },
    { name: 'XRP',                  symbol: 'XRP-USD' },
    { name: 'Cardano',              symbol: 'ADA-USD' },
    { name: 'Avalanche',            symbol: 'AVAX-USD' },
    { name: 'Dogecoin',             symbol: 'DOGE-USD' },
    { name: 'Polkadot',             symbol: 'DOT-USD' },
    { name: 'Chainlink',            symbol: 'LINK-USD' },
    { name: 'Litecoin',             symbol: 'LTC-USD' },
    { name: 'Shiba Inu',            symbol: 'SHIB-USD' },
    { name: 'USDC',                 symbol: 'USDC-USD' },
    { name: 'Tether',               symbol: 'USDT-USD' },
  ],
  Commodities: [
    { name: 'Gold (MCX)',           symbol: 'GC=F' },
    { name: 'Silver (MCX)',         symbol: 'SI=F' },
    { name: 'Crude Oil (WTI)',      symbol: 'CL=F' },
    { name: 'Copper (MCX)',         symbol: 'HG=F' },
    { name: 'Natural Gas',          symbol: 'NG=F' },
    { name: 'Platinum',             symbol: 'PL=F' },
    { name: 'Palladium',            symbol: 'PA=F' },
    { name: 'Brent Crude Oil',      symbol: 'BZ=F' },
  ],
  'Real Estate': [
    { name: 'Bangalore Apartment',  symbol: 'RE-BLR' },
    { name: 'Mumbai Apartment',     symbol: 'RE-MUM' },
    { name: 'Delhi Property',       symbol: 'RE-DEL' },
    { name: 'Hyderabad Property',   symbol: 'RE-HYD' },
    { name: 'Chennai Property',     symbol: 'RE-CHN' },
    { name: 'Pune Property',        symbol: 'RE-PUN' },
    { name: 'Kolkata Property',     symbol: 'RE-KOL' },
    { name: 'Commercial Space',     symbol: 'RE-COM' },
    { name: 'US Real Estate (VNQ)', symbol: 'VNQ' },
  ],
  ETFs: [
    { name: 'Nifty 50 ETF (Nippon)',    symbol: 'NIFTYBEES.NS' },
    { name: 'HDFC Sensex ETF',          symbol: 'HDFCSENSEX.NS' },
    { name: 'Mirae Nasdaq 100 FOF',     symbol: 'MAFANG.NS' },
    { name: 'Gold ETF (SBI)',           symbol: 'SETFGOLD.NS' },
    { name: 'Vanguard S&P 500 (VOO)',   symbol: 'VOO' },
    { name: 'SPDR S&P 500 (SPY)',       symbol: 'SPY' },
    { name: 'iShares MSCI India (INDA)',symbol: 'INDA' },
    { name: 'Invesco QQQ (Nasdaq)',     symbol: 'QQQ' },
    { name: 'VTI Total Market',        symbol: 'VTI' },
    { name: 'ARKK Innovation ETF',     symbol: 'ARKK' },
  ],
  Bonds: [
    { name: 'Govt Bond 10Y India',   symbol: '^IN10Y' },
    { name: 'US Treasury 10Y',       symbol: '^TNX' },
    { name: 'US Treasury 30Y',       symbol: '^TYX' },
    { name: 'India T-Bill 91D',      symbol: 'IN91D.BO' },
    { name: 'iShares US Bonds (AGG)',symbol: 'AGG' },
  ],
};

const inputCls = {
  padding: '11px 14px',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff',
  fontSize: '0.9rem',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelCls = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '6px',
  display: 'block',
};

const AddAssetModal = ({ onClose }) => {
  const { addAsset } = useAssets();
  const [formData, setFormData] = useState({
    type: 'Stocks',
    name: '',
    symbol: '',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    maturityDate: '',
    returnRate: '',
  });
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [symbolManual, setSymbolManual] = useState(false);

  const suggestions = useMemo(() => {
    const pool = TICKER_SUGGESTIONS[formData.type] || [];
    if (!search.trim()) return pool.slice(0, 8);
    const q = search.toLowerCase();
    return pool
      .filter(s => s.name.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q))
      .slice(0, 8);
  }, [search, formData.type]);

  const pickSuggestion = (s) => {
    setFormData(prev => ({ ...prev, name: s.name, symbol: s.symbol }));
    setSearch(s.name);
    setShowSuggestions(false);
    setSymbolManual(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Reset name/symbol when type changes
    if (name === 'type') {
      setFormData(prev => ({ ...prev, type: value, name: '', symbol: '' }));
      setSearch('');
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setFormData(prev => ({ ...prev, name: e.target.value }));
    setShowSuggestions(true);
    // If user is typing a custom name, don't auto-set symbol
    if (!TICKER_SUGGESTIONS[formData.type]?.find(s => s.name === e.target.value)) {
      setSymbolManual(true);
    }
  };

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.symbol.trim()) return;
    setError('');
    setSaving(true);
    try {
      await addAsset({ ...formData, symbol: formData.symbol.trim().toUpperCase() });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save asset. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: '480px',
          background: 'rgba(12,12,12,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          padding: '28px',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Add Asset</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
              Search by name or enter a ticker symbol
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Asset Type */}
          <div>
            <label style={labelCls}>Asset Type</label>
            <div style={{ position: 'relative' }}>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={{ ...inputCls, appearance: 'none', paddingRight: '36px', cursor: 'pointer' }}
              >
                {['Stocks', 'Crypto', 'Commodities', 'Real Estate', 'ETFs', 'Bonds'].map(t => (
                  <option key={t} value={t} style={{ background: '#111' }}>{t}</option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Asset Name with autocomplete */}
          <div style={{ position: 'relative' }}>
            <label style={labelCls}>Asset Name</label>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }} />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder={`Search ${formData.type}… e.g. ${TICKER_SUGGESTIONS[formData.type]?.[0]?.name || 'Apple Inc.'}`}
                style={{ ...inputCls, paddingLeft: '36px' }}
                required
                autoComplete="off"
              />
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                background: 'rgba(16,16,16,0.99)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                maxHeight: '220px',
                overflowY: 'auto',
              }}>
                {suggestions.map(s => (
                  <div
                    key={s.symbol}
                    onMouseDown={() => pickSuggestion(s)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '0.9rem', color: '#e8e8e8' }}>{s.name}</span>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700,
                      color: 'var(--accent-color)',
                      background: 'rgba(59,130,246,0.12)',
                      padding: '2px 8px', borderRadius: '20px',
                      fontFamily: 'monospace', letterSpacing: '0.3px',
                    }}>{s.symbol}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticker Symbol */}
          <div>
            <label style={labelCls}>
              Ticker Symbol <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(auto-filled or enter manually)</span>
            </label>
            <input
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={e => { setFormData(prev => ({ ...prev, symbol: e.target.value })); setSymbolManual(true); }}
              placeholder="e.g. RELIANCE.NS · AAPL · BTC-USD"
              style={{
                ...inputCls,
                fontFamily: 'monospace',
                letterSpacing: '0.5px',
                fontWeight: formData.symbol ? 600 : 400,
                color: formData.symbol ? 'var(--accent-color)' : '#888',
              }}
              required
            />
          </div>

          {/* Quantity + Buy Price */}
          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelCls}>Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g. 10"
                step="any"
                min="0"
                style={inputCls}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelCls}>Avg Buy Price (₹)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 2400"
                step="any"
                min="0"
                style={inputCls}
                required
              />
            </div>
          </div>

          {/* Date Acquired */}
          <div>
            <label style={labelCls}>Date Acquired</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              style={{ ...inputCls, colorScheme: 'dark' }}
              required
            />
          </div>

          {/* Bond-specific fields */}
          {formData.type === 'Bonds' && (
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelCls}>Maturity Date</label>
                <input
                  type="date"
                  name="maturityDate"
                  value={formData.maturityDate}
                  onChange={handleChange}
                  style={{ ...inputCls, colorScheme: 'dark' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelCls}>Return Rate (%)</label>
                <input
                  type="number"
                  name="returnRate"
                  value={formData.returnRate}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="e.g. 7.15"
                  style={inputCls}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(255,0,0,0.1)', color: '#ff4444', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(255,0,0,0.2)' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: '4px',
              padding: '14px',
              borderRadius: '10px',
              background: saving ? '#333' : 'var(--accent-color)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              letterSpacing: '0.3px',
              opacity: saving ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {saving ? 'Saving…' : 'Save Asset'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAssetModal;
