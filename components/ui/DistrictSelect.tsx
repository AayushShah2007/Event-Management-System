"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WR_STATIONS } from "@/lib/wr-stations";

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DistrictSelect({ value, onChange, className }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`bg-white/5 text-white border-white/10 ${className || ""}`}>
        <SelectValue placeholder="Select district" />
      </SelectTrigger>
      <SelectContent className="bg-charcoal-800 border-white/10 max-h-60">
        {WR_STATIONS.map((station) => (
          <SelectItem key={station} value={station} className="text-white hover:bg-white/10">
            {station}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
