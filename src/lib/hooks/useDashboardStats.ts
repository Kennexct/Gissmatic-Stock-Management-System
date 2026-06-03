import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export function useDashboardStats() {
  const [totalParts, setTotalParts] = useState(0);
  const [outOfStock, setOutOfStock] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [categoryData, setCategoryData] = useState<{name: string, value: number}[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get total parts
      const { count: partsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      setTotalParts(partsCount || 0);

      // Get out of stock
      const { count: outCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('quantity', 0);
      setOutOfStock(outCount || 0);

      // Get low stock products for the list (e.g. quantity < 5)
      const { data: lowData } = await supabase.from('products').select('id, name, part_number, quantity, tracking_type').lt('quantity', 5).order('quantity', { ascending: true }).limit(10);
      if (lowData) setLowStockProducts(lowData);

      // For Total Units and Category Data, we need a lightweight query or an RPC.
      // Since we don't have an RPC, we will fetch only 'quantity' and 'category' to minimize payload.
      const { data: lightweightData } = await supabase.from('products').select('category, quantity');
      if (lightweightData) {
        let sum = 0;
        const catMap: Record<string, number> = {};
        lightweightData.forEach(p => {
          sum += p.quantity;
          if (p.category) {
            catMap[p.category] = (catMap[p.category] || 0) + 1;
          }
        });
        setTotalUnits(sum);
        
        const cData = Object.keys(catMap).map(k => ({ name: k, value: catMap[k] }));
        cData.sort((a, b) => b.value - a.value);
        setCategoryData(cData.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { totalParts, outOfStock, totalUnits, categoryData, lowStockProducts, isLoading, refetch: fetchStats };
}
