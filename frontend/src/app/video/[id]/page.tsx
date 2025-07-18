"use client";

import React from "react";
import { VideoDetailPage } from "@/components/video-detail-page";

export default function VideoDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  return <VideoDetailPage videoId={id} />;
}
