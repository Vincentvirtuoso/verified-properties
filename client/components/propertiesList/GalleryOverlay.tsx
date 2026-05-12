import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuX, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import Image from "next/image";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { Property } from "@/types";
import { imageLoader } from "../../utils/helpers";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

const defaultImage = "/placeholder-property.png";

export const GalleryOverlay = ({
  showGallery,
  setShowGallery,
  currentImageIndex,
  setCurrentImageIndex,
  galleryImages,
  property,
}: {
  showGallery: boolean;
  setShowGallery: (state: boolean) => void;
  currentImageIndex: number;
  setCurrentImageIndex: (state: number) => void;
  galleryImages: string[];
  property: Property;
}) => {
  const { bannerHeight } = useBannerHeightContext();
  const [imgSrc, setImgSrc] = useState(
    galleryImages[currentImageIndex] || defaultImage,
  );

  const paginate = useCallback(
    (newDirection: number) => {
      const nextIndex =
        (currentImageIndex + newDirection + galleryImages.length) %
        galleryImages.length;
      setCurrentImageIndex(nextIndex);
    },
    [currentImageIndex, galleryImages.length],
  );

  useEffect(() => {
    if (!showGallery) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") paginate(-1);
      if (e.key === "ArrowRight") paginate(1);
      if (e.key === "Escape") setShowGallery(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [showGallery, paginate]);

  return (
    <AnimatePresence>
      {showGallery && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 bg-black/95 backdrop-blur-sm flex items-center justify-center overflow-hidden"
          style={{ top: bannerHeight }}
        >
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-6 right-6 z-110 text-white p-3 bg-white/5 hover:bg-white/20 rounded-full transition-all"
            aria-label="Close gallery"
          >
            <LuX className="w-6 h-6" />
          </button>

          <div className="absolute inset-x-4 flex justify-between items-center z-110 pointer-events-none">
            <button
              onClick={() => paginate(-1)}
              className="pointer-events-auto text-white p-3 bg-black/20 hover:bg-black/40 rounded-full transition-all"
              aria-label="Previous image"
            >
              <LuChevronLeft className="w-8 h-8" />
            </button>

            <button
              onClick={() => paginate(1)}
              className="pointer-events-auto text-white p-3 bg-black/20 hover:bg-black/40 rounded-full transition-all"
              aria-label="Next image"
            >
              <LuChevronRight className="w-8 h-8" />
            </button>
          </div>

          <div className="relative w-full max-w-6xl h-[75vh] mx-4 flex items-center justify-center">
            <AnimatePresence initial={false} custom={currentImageIndex}>
              <motion.div
                key={currentImageIndex}
                custom={currentImageIndex}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0"
              >
                <Image
                  src={imgSrc}
                  alt={`${property.title} - ${currentImageIndex + 1}`}
                  fill
                  loader={imageLoader}
                  priority
                  className="object-contain"
                  sizes="100vw"
                  onError={() => {
                    if (imgSrc !== defaultImage) setImgSrc(defaultImage);
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full text-white text-sm font-medium tracking-wider">
            {currentImageIndex + 1} / {galleryImages.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
