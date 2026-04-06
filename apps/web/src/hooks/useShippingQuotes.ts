// TODO: [MIGRATION] This hook calls the legacy "get-shipping-quotes" Supabase edge function.
// Migrate to Java/Python API per docs/service-boundaries.md when backend is ready.

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PackageItem, QuoteResults } from "@/lib/shipping-data";
import { useToast } from "@/hooks/use-toast";

export function useShippingQuotes() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<QuoteResults | null>(null);
  const { toast } = useToast();

  const fetchQuotes = async (
    origin: string,
    destination: string,
    dropDate: string,
    delivDate: string,
    packages: PackageItem[]
  ) => {
    setLoading(true);
    setData(null);

    try {
      const { data: result, error } = await supabase.functions.invoke("get-shipping-quotes", {
        body: { origin, destination, dropOffDate: dropDate, expectedDeliveryDate: delivDate, packages },
      });

      if (error) throw error;
      setData(result as QuoteResults);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch quotes";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return { loading, data, fetchQuotes };
}
