import React, { useEffect, useRef } from "react";

export const useBannerHeight = (
  bannerRef: React.RefObject<HTMLDivElement | null>,
) => {
  const [bannerHeight, setBannerHeight] = React.useState(0);

  useEffect(() => {
    if (!bannerRef?.current) return;

    const observer = new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;
      setBannerHeight(height);
    });

    observer.observe(bannerRef.current);
    return () => observer.disconnect();
  }, []);

  return {
    bannerHeight,
    setBannerHeight,
    bannerRef,
  };
};
