"use client";

import React from "react";
import { BasinDetailPage } from "@/components/basin-detail-page";

export default function BasinDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  return <BasinDetailPage basinId={id} />;
}
