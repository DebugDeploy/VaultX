import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchLivePrices } from '../services/priceService';
import { db } from '../firebase.config';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

const AssetContext = createContext();

export const useAssets = () => useContext(AssetContext);

const REFRESH_INTERVAL = 60_000;

export const AssetProvider = ({ children }) => {
  const { user } = useAuth();
  const { family, familyId } = useSettings();

  const [assets, setAssets] = useState([]);
  const [livePriceMap, setLivePriceMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [activePortfolio, setActivePortfolio] = useState('combined');

  // Reset active portfolio when user changes (logout/login)
  useEffect(() => {
    setActivePortfolio('combined');
  }, [user?.uid]);

  const [priceStatus, setPriceStatus] = useState('idle');

  // ── Firestore Sync — listen to families/{familyId}/assets ───────
  useEffect(() => {
    if (!user || !familyId) {
      setAssets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const assetsRef = collection(db, 'families', familyId, 'assets');

    const unsub = onSnapshot(
      assetsRef,
      (snapshot) => {
        const assetsList = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));
        setAssets(assetsList);
        setLoading(false);
      },
      (error) => {
        console.error(`Firestore assets error:`, error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, familyId]);

  // ── Live Price Refresh ──────────────────────────────────────
  const refreshPrices = useCallback(async (currentAssets) => {
    if (!currentAssets || currentAssets.length === 0) return;
    setPriceStatus('loading');
    try {
      const symbols = [...new Set(currentAssets.map(a => a.symbol))];
      const priceMap = await fetchLivePrices(symbols);
      if (Object.keys(priceMap).length === 0) { setPriceStatus('error'); return; }
      setLivePriceMap(priceMap);
      setPriceStatus('live');
    } catch (err) {
      console.error('[AssetContext] Price refresh failed:', err);
      setPriceStatus('error');
    }
  }, []);

  const symbolsString = [...new Set(assets.map(a => a.symbol))].sort().join(',');
  useEffect(() => {
    if (assets.length > 0) refreshPrices(assets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsString, refreshPrices]);

  useEffect(() => {
    if (assets.length === 0) return;
    const interval = setInterval(() => refreshPrices(assets), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [assets.length, refreshPrices]);

  // ── Merge live prices into assets ───────────────────────────
  const usdInrRate = livePriceMap['USDINR=X']?.price || 83.3;
  const enrichedAssets = assets.map(asset => {
    const live = livePriceMap[asset.symbol];
    if (live) {
      return {
        ...asset,
        currentPrice: live.price,
        liveChange: live.change,
        liveChangePercent: live.changePercent,
        currency: live.currency,
        currentPriceINR: live.currency === 'USD' ? live.price * usdInrRate : live.price,
        avgPriceINR:
          (asset.currency === 'USD' || !asset.symbol?.endsWith('.NS')) && asset.avgPrice < 10000
            ? asset.avgPrice * usdInrRate
            : asset.avgPrice,
      };
    }
    return asset;
  });

// ── Portfolio Members list ──────────────────────────────────
  const portfolioMembers = (family?.members || []).filter(m => m.uid);

  // ── Filtered view ───────────────────────────────────────────
  const filteredAssets = activePortfolio === 'combined'
    ? enrichedAssets
    : enrichedAssets.filter(a => {
        if (a.ownerUid) return a.ownerUid === activePortfolio;
        // Fallback for legacy assets without ownerUid
        const member = portfolioMembers.find(m => m.uid === activePortfolio);
        return member && a.owner === member.name;
      });

  // ── CRUD ────────────────────────────────────────────────────
  const addAsset = async (assetData) => {
    if (!user) throw new Error('You must be logged in to add assets.');
    if (!familyId) throw new Error('Portfolio not ready yet. Please wait a moment and try again.');

    const symbol = (assetData.symbol || assetData.name?.substring(0, 4)).toUpperCase();
    const incomingQty = Number(assetData.quantity);
    const incomingPrice = Number(assetData.price || assetData.avgPrice);

    // Check if this user already owns this symbol
    const existing = assets.find(a => a.symbol === symbol && a.ownerUid === user.uid);

    if (existing) {
      // Weighted average price: (oldQty * oldAvg + newQty * newPrice) / totalQty
      const totalQty = existing.quantity + incomingQty;
      const weightedAvg = ((existing.quantity * existing.avgPrice) + (incomingQty * incomingPrice)) / totalQty;
      await updateDoc(doc(db, 'families', familyId, 'assets', existing.id), {
        quantity: totalQty,
        avgPrice: weightedAvg,
      });
      return;
    }

    const currentMember = family?.members?.find(m => m.uid === user.uid);
    const ownerName = currentMember?.name || user.displayName || user.email?.split('@')[0];

    await addDoc(collection(db, 'families', familyId, 'assets'), {
      ...assetData,
      symbol,
      quantity: incomingQty,
      avgPrice: incomingPrice,
      currentPrice: incomingPrice,
      owner: ownerName,
      ownerUid: user.uid,
      createdAt: new Date().toISOString(),
    });
  };

  const updateAsset = async (updatedAsset) => {
    if (!user || !updatedAsset.id || !familyId) return;
    const { id, ...data } = updatedAsset;
    await updateDoc(doc(db, 'families', familyId, 'assets', id), data);
  };

  const deleteAsset = async (id) => {
    if (!user || !familyId) return;
    try {
      await deleteDoc(doc(db, 'families', familyId, 'assets', id));
    } catch (err) {
      console.error('Error deleting asset:', err);
    }
  };

  return (
    <AssetContext.Provider
      value={{
        assets: filteredAssets,
        allAssets: enrichedAssets,
        loading,
        addAsset,
        updateAsset,
        deleteAsset,
        activePortfolio,
        setActivePortfolio,
        portfolioMembers,
        priceStatus,
      }}
    >
      {children}
    </AssetContext.Provider>
  );
};
