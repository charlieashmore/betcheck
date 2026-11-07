import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const fixturesQuery = queryOptions({
  queryKey: ["fixtures"],
  queryFn: async () => {
    const { data, error } = await supabase.from("fixtures").select("*").order("start_time");
    if (error) throw error;
    return data;
  },
});
