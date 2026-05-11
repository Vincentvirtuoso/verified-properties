// app/properties/[slug]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { properties } from "@/data/properties";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  FaBed,
  FaBath,
  FaExpand,
  FaAward,
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
} from "react-icons/fa";
import {
  FiShare2,
  FiHeart,
  FiMapPin,
  FiCalendar,
  FiHome,
} from "react-icons/fi";
import { formatPrice, formatRelativeTime } from "@/lib/formatters";
import { motion, AnimatePresence } from "framer-motion";
import { imageLoader } from "@/components/cards/helpers";
import { LuMapPin, LuChevronLeft, LuChevronRight, LuX } from "react-icons/lu";
import Link from "next/link";
import { PropertyCard } from "@/components/cards/PropertyCard";
import VerifiedBadge from "@/components/icons/VerifiedBadge";

const defaultImage = "/placeholder-property.png";
const defaultAgentImage = "/placeholder_agent.png";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [property, setProperty] = useState(() =>
    properties.find((p) => p.slug === slug),
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [imgSrc, setImgSrc] = useState(property?.image || defaultImage);
  const [imgAgentSrc, setImgAgentSrc] = useState(
    property?.agent?.image || defaultAgentImage,
  );

  useEffect(() => {
    if (!property) {
      router.push("/properties");
    }
  }, [property, router]);

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Property Not Found
          </h2>
          <button
            onClick={() => router.push("/properties")}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  const discountedPrice = property.discount?.percentage
    ? property.price - (property.price * property.discount.percentage) / 100
    : property.discount?.amount
      ? property.price - property.discount.amount
      : property.price;

  const hasDiscount =
    property.discount &&
    (property.discount.percentage || property.discount.amount);
  const savingsAmount = property.price - discountedPrice;
  const savingsPercentage =
    property.discount?.percentage ||
    Math.round((savingsAmount / property.price) * 100);

  const galleryImages = [
    property.image,
    ...(property.gallery?.map((g) => g.url) || []),
  ].filter(Boolean) as string[];

  const similarProperties = properties
    .filter(
      (p) =>
        p._id !== property._id &&
        p.type === property.type &&
        p.listingType === property.listingType,
    )
    .slice(0, 3);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + galleryImages.length) % galleryImages.length,
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: property.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleContactAgent = (method: "call" | "whatsapp" | "email") => {
    if (!property.agent) return;

    switch (method) {
      case "call":
        if (property.agent.phone) {
          window.location.href = `tel:${property.agent.phone}`;
        }
        break;
      case "whatsapp":
        if (property.agent.phone) {
          const message = `Hi ${property.agent.name}, I'm interested in ${property.title}`;
          window.open(
            `https://wa.me/${property.agent.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
            "_blank",
          );
        }
        break;
      case "email":
        if (property.agent.email) {
          window.location.href = `mailto:${property.agent.email}?subject=Inquiry about ${property.title}`;
        }
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-violet-600">
              Home
            </Link>
            <span>/</span>
            <Link href="/properties" className="hover:text-violet-600">
              Properties
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate">
              {property.title}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {property.sponsored && (
                <span className="bg-linear-to-r from-orange-500 to-orange-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  Sponsored
                </span>
              )}
              {property.isFeatured && (
                <span className="bg-linear-to-r from-violet-600 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  ✨ Featured
                </span>
              )}
              <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-semibold capitalize">
                For {property.listingType}
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              {property.title}
            </h1>
            <p className="flex items-center gap-2 text-gray-600">
              <LuMapPin className="shrink-0" />
              <span>{property.location}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FiShare2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FiHeart
                className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-600"}`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <div className="lg:col-span-2 relative h-96 lg:h-125 rounded-2xl overflow-hidden">
            <Image
              src={galleryImages[0] || defaultImage}
              alt={property.title}
              loader={imageLoader}
              fill
              className="object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => {
                setCurrentImageIndex(0);
                setShowGallery(true);
              }}
            />
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {galleryImages.slice(1, 5).map((img, index) => (
              <div
                key={index}
                className="relative h-48 lg:h-60.5 rounded-2xl overflow-hidden"
              >
                <Image
                  src={img}
                  alt={`${property.title} - Image ${index + 2}`}
                  loader={imageLoader}
                  fill
                  className="object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => {
                    setCurrentImageIndex(index + 1);
                    setShowGallery(true);
                  }}
                />
                {index === 3 && galleryImages.length > 5 && (
                  <div
                    className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      setCurrentImageIndex(4);
                      setShowGallery(true);
                    }}
                  >
                    <span className="text-white text-xl font-bold">
                      +{galleryImages.length - 5} more
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-baseline gap-3 mb-4 flex-wrap">
                {hasDiscount ? (
                  <>
                    <p className="text-4xl font-bold text-violet-600">
                      {formatPrice(discountedPrice)}
                    </p>
                    <p className="text-xl text-gray-400 line-through">
                      {formatPrice(property.price)}
                    </p>
                    <div className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                      Save {formatPrice(savingsAmount)} ({savingsPercentage}%
                      OFF)
                    </div>
                  </>
                ) : (
                  <p className="text-4xl font-bold text-violet-600">
                    {formatPrice(property.price)}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Property Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <FaBed className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bedrooms</p>
                    <p className="font-semibold text-gray-900">
                      {property.bedrooms}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <FaBath className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bathrooms</p>
                    <p className="font-semibold text-gray-900">
                      {property.bathrooms}
                    </p>
                  </div>
                </div>
                {property.area && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                      <FaExpand className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Area</p>
                      <p className="font-semibold text-gray-900">
                        {property.area} m²
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <FiHome className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Property Type</p>
                    <p className="font-semibold text-gray-900">
                      {property.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <FiCalendar className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Listed</p>
                    <p className="font-semibold text-gray-900">
                      {property.createdAt
                        ? formatRelativeTime(property.createdAt)
                        : "Recently"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <FaAward className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {property.status || "Available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Description
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {property.description}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {property.agent && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Listed By
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  {property.agent.image ? (
                    <Image
                      src={imgAgentSrc}
                      alt={property.agent.name}
                      loader={imageLoader}
                      width={64}
                      height={64}
                      onError={() => setImgAgentSrc(defaultAgentImage)}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {property.agent.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/agents/${property.agent.id}`}
                      className="font-bold text-gray-900 hover:text-violet-600 transition-colors"
                    >
                      {property.agent.name}
                    </Link>
                    {property.agent.company && (
                      <p className="text-sm text-gray-500">
                        {property.agent.company}
                      </p>
                    )}
                    {property.agent.verified && <VerifiedBadge />}
                  </div>
                </div>
                <div className="space-y-2">
                  {property.agent.phone && (
                    <>
                      <button
                        onClick={() => handleContactAgent("call")}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium"
                      >
                        <FaPhone className="w-4 h-4" />
                        Call Agent
                      </button>
                      <button
                        onClick={() => handleContactAgent("whatsapp")}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                      >
                        <FaWhatsapp className="w-4 h-4" />
                        WhatsApp
                      </button>
                    </>
                  )}
                  {property.agent.email && (
                    <button
                      onClick={() => handleContactAgent("email")}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      <FaEnvelope className="w-4 h-4" />
                      Send Email
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Location</h3>
              <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <FiMapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Map would be displayed here
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">{property.location}</p>
            </div>
          </div>
        </div>

        {similarProperties.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Similar Properties
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map((prop) => (
                <PropertyCard key={prop._id} {...prop} />
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          >
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LuX className="w-6 h-6" />
            </button>

            <button
              onClick={prevImage}
              className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LuChevronLeft className="w-8 h-8" />
            </button>

            <div className="relative w-full max-w-5xl h-[80vh] mx-4">
              <Image
                src={galleryImages[currentImageIndex]}
                alt={`${property.title} - Image ${currentImageIndex + 1}`}
                loader={imageLoader}
                fill
                className="object-contain"
              />
            </div>

            <button
              onClick={nextImage}
              className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LuChevronRight className="w-8 h-8" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {currentImageIndex + 1} / {galleryImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
