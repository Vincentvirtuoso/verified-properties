"use client";

import { Property } from "@/types/property";
import Image from "next/image";
import { useState } from "react";
import { FaBed, FaBath, FaExpand, FaClock } from "react-icons/fa";
import { formatPrice, formatRelativeTime } from "@/lib/formatters";
import { FiClock } from "react-icons/fi";

const defaultImage = "/placeholder-property.png";

export function PropertyCard({
  title,
  location,
  price,
  bedrooms,
  bathrooms,
  area = 0,
  image,
  listingType,
  sponsored = false,
  isFeatured,
  agent,
  discount,
  createdAt,
}: Property) {
  const [imgSrc, setImgSrc] = useState(image || defaultImage);

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all group cursor-pointer">
      <div className="relative h-64">
        <Image
          src={imgSrc}
          alt={title}
          fill
          onError={() => {
            if (imgSrc !== defaultImage) setImgSrc(defaultImage);
          }}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 space-y-2">
          {sponsored && (
            <div className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
              Sponsored
            </div>
          )}

          {isFeatured && (
            <div className="bg-violet-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
              Featured
            </div>
          )}
        </div>

        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-gray-700 capitalize shadow-sm">
          {listingType}
        </div>

        {discount?.percentage && (
          <div className="absolute bottom-3 left-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
            -{discount.percentage}%
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-violet-600 font-bold text-2xl tracking-tight">
          {formatPrice(price)}
        </p>

        <h3 className="font-semibold text-lg mt-2 line-clamp-2 leading-tight">
          {title}
        </h3>

        <p className="text-gray-500 text-sm mt-1 line-clamp-1">{location}</p>

        <div className="flex items-center gap-5 mt-5 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <FaBed className="text-lg" />
            <span className="font-medium">{bedrooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FaBath className="text-lg" />
            <span className="font-medium">{bathrooms}</span>
          </div>
          {area > 0 && (
            <div className="flex items-center gap-1.5">
              <FaExpand className="text-lg" />
              <span className="font-medium">{area.toLocaleString()} m²</span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
          {agent && (
            <div className="flex items-center gap-2">
              {agent.image && (
                <Image
                  src={agent.image}
                  alt={agent.name}
                  width={28}
                  height={28}
                  className="rounded-full object-cover ring-1 ring-gray-100"
                />
              )}
              <div>
                <p className="font-medium text-gray-700 truncate max-w-[140px]">
                  {agent.name}
                </p>
              </div>
            </div>
          )}

          {createdAt && (
            <div className="flex items-center gap-1.5 text-gray-400">
              <FiClock size={13} />
              <span>{formatRelativeTime(createdAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
