import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Product } from '../types';

interface UseProductsOptions {
  page: number;
  pageSize: number;
  searchQuery?: string;
  category?: string;
  trackingType?: string;
}

export function useProducts(options: UseProductsOptions) {
  const { page, pageSize, searchQuery, category, trackingType } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      // Apply filters
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,part_number.ilike.%${searchQuery}%`);
      }
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      if (trackingType && trackingType !== 'All') {
        query = query.eq('tracking_type', trackingType);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (data) {
        const mappedProducts: Product[] = data.map((db: any) => ({
          id: db.id,
          partNumber: db.part_number,
          name: db.name,
          description: db.description,
          imageUrl: db.image_url,
          category: db.category,
          trackingType: db.tracking_type,
          quantity: db.quantity,
          serialNumbers: db.serial_numbers || [],
          supplierName: db.supplier_name,
          lastUpdated: db.last_updated || db.created_at || new Date().toISOString(),
        }));
        setProducts(mappedProducts);
      }
      if (count !== null) {
        setTotalCount(count);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchQuery, category, trackingType]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (productData: Omit<Product, "id" | "lastUpdated">) => {
    try {
      const { error } = await supabase.from('products').insert({
        part_number: productData.partNumber,
        name: productData.name,
        description: productData.description || '',
        category: productData.category,
        tracking_type: productData.trackingType,
        quantity: productData.quantity,
        serial_numbers: productData.serialNumbers || [],
        supplier_name: productData.supplierName || null,
        image_url: productData.imageUrl || null
      });
      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error("Error adding product:", err);
      throw err;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const dbUpdates: any = { last_updated: new Date().toISOString() };
      if (updates.partNumber !== undefined) dbUpdates.part_number = updates.partNumber;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.trackingType !== undefined) dbUpdates.tracking_type = updates.trackingType;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.serialNumbers !== undefined) dbUpdates.serial_numbers = updates.serialNumbers;
      if (updates.supplierName !== undefined) dbUpdates.supplier_name = updates.supplierName;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;

      const { error } = await supabase.from('products').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error("Error updating product:", err);
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      throw err;
    }
  };

  return {
    products,
    totalCount,
    isLoading,
    error,
    refetch: fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct
  };
}
