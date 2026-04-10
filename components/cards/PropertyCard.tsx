import { Property } from "@/types/property";
import Image from "next/image";
import { FaBed, FaBath, FaExpand } from "react-icons/fa";

const defaultImage = "/placeholder-property.png";

export function PropertyCard({
  title,
  location,
  price,
  type,
  bedrooms,
  bathrooms,
  area = "0m²",
  image = defaultImage,
  listingType,
  sponsored = false,
  agent,
  timeAgo,
}: Property) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all group">
      <div className="relative h-64">
        <Image
          src={image || defaultImage}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {sponsored && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium">
            Sponsored
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
          {listingType}
        </div>
      </div>

      <div className="p-5">
        <p className="text-violet-600 font-semibold text-lg">{price}</p>
        <h3 className="font-semibold text-lg mt-1 line-clamp-2">{title}</h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-1">{location}</p>

        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <FaBed /> <span>{bedrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <FaBath /> <span>{bathrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <FaExpand /> <span>{area}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-gray-500">
          {agent && <p>By {agent}</p>}
          {timeAgo && <p>{timeAgo}</p>}
        </div>
      </div>
    </div>
  );
}
