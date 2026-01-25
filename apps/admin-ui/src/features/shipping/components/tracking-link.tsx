"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Carrier } from "../types";

const TRACKING_URLS: Record<Carrier, (trackingNumber: string) => string> = {
  YAMATO: (n) =>
    `https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number=${n}`,
  SAGAWA: (n) =>
    `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${n}`,
  JAPAN_POST: (n) =>
    `https://trackings.post.japanpost.jp/services/srv/search?requestNo1=${n}`,
};

interface TrackingLinkProps {
  carrier: Carrier;
  trackingNumber: string;
}

export function TrackingLink({ carrier, trackingNumber }: TrackingLinkProps) {
  const urlGenerator = TRACKING_URLS[carrier];

  if (!urlGenerator) {
    return null;
  }

  const url = urlGenerator(trackingNumber);

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      asChild
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-4 w-4" />
        追跡を確認
      </a>
    </Button>
  );
}
