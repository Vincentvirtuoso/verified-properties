// app/agents/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { properties } from "@/data/properties";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import {
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
  FaAward,
  FaHome,
  FaBuilding,
} from "react-icons/fa";
import { FiCheckCircle, FiUser } from "react-icons/fi";
import { formatPrice } from "@/lib/formatters";
import { imageLoader } from "@/components/cards/helpers";
import { PropertyCard } from "@/components/cards/PropertyCard";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";
import { LuHouse } from "react-icons/lu";

const defaultAgentImage = "/placeholder_agent.png";

export default function AgentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [imgAgentSrc, setImgAgentSrc] = useState(defaultAgentImage);

  const agentData = useMemo(() => {
    const agentProperties = properties.filter((p) => p.agent?.id === agentId);
    const agent = agentProperties[0]?.agent;

    return { agent, agentProperties };
  }, [agentId]);

  const { agent, agentProperties } = agentData;

  useEffect(() => {
    if (!agent) {
      router.push("/properties");
    }
  }, [agent, router]);

  useEffect(() => {
    if (agent?.image) {
      setImgAgentSrc(agent.image);
    }
  }, [agent]);

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Agent Not Found
          </h2>
          <button
            onClick={() => router.push("/properties")}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    totalProperties: agentProperties.length,
    forSale: agentProperties.filter((p) => p.listingType === "sale").length,
    forRent: agentProperties.filter((p) => p.listingType === "rent").length,
    totalValue: agentProperties.reduce((sum, p) => sum + p.price, 0),
  };

  const breadcrumbItems = [
    {
      label: "Properties",
      href: "/properties",
      icon: <LuHouse className="w-3.5 h-3.5" />,
    },
    {
      label: "Agents",
      href: "/agents",
      icon: <FiUser className="w-3.5 h-3.5" />,
    },
    {
      label: agent.company || "Agent",
      href: agent.company
        ? `/agents?company=${encodeURIComponent(agent.company)}`
        : undefined,
    },
    {
      label: agent.name,
    },
  ];

  const handleContact = (method: "call" | "whatsapp" | "email") => {
    switch (method) {
      case "call":
        if (agent.phone) {
          window.location.href = `tel:${agent.phone}`;
        }
        break;
      case "whatsapp":
        if (agent.phone) {
          const message = `Hi ${agent.name}, I'm interested in your properties`;
          window.open(
            `https://wa.me/${agent.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
            "_blank",
          );
        }
        break;
      case "email":
        if (agent.email) {
          window.location.href = `mailto:${agent.email}?subject=Property Inquiry`;
        }
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={breadcrumbItems}
        variant="bordered"
        size="md"
        maxItems={4}
        showTooltip={true}
        className="border-0! bg-transparent!"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
          <div className="h-32 bg-linear-to-r from-violet-600 to-purple-600"></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="-mt-12">
                {agent.image ? (
                  <Image
                    src={imgAgentSrc}
                    alt={agent.name}
                    loader={imageLoader}
                    width={120}
                    height={120}
                    onError={() => setImgAgentSrc(defaultAgentImage)}
                    className="rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                    {agent.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 pt-4">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {agent.name}
                  </h1>
                  {agent.verified && (
                    <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm font-medium">
                      <FiCheckCircle className="w-4 h-4" />
                      Verified Agent
                    </span>
                  )}
                </div>
                {agent.company && (
                  <p className="flex items-center gap-2 text-gray-600 mb-4">
                    <FaBuilding className="w-4 h-4" />
                    {agent.company}
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                {agent.phone && (
                  <>
                    <button
                      onClick={() => handleContact("call")}
                      className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <FaPhone className="w-4 h-4" />
                      Call
                    </button>
                    <button
                      onClick={() => handleContact("whatsapp")}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                      WhatsApp
                    </button>
                  </>
                )}
                {agent.email && (
                  <button
                    onClick={() => handleContact("email")}
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                  >
                    <FaEnvelope className="w-4 h-4" />
                    Email
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <FaHome className="w-8 h-8 text-violet-600 mb-3" />
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalProperties}
            </p>
            <p className="text-gray-600">Total Properties</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-green-600 font-bold text-lg">₦</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.forSale}</p>
            <p className="text-gray-600">For Sale</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-blue-600 font-bold text-lg">R</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.forRent}</p>
            <p className="text-gray-600">For Rent</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <FaAward className="w-8 h-8 text-violet-600 mb-3" />
            <p className="text-3xl font-bold text-gray-900">
              {formatPrice(stats.totalValue).replace("₦", "")}
            </p>
            <p className="text-gray-600">Total Value</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Properties Listed by {agent.name.split(" ")[0]}
          </h2>
          {agentProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agentProperties.map((property) => (
                <PropertyCard key={property._id} {...property} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
              <FaHome className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Properties Yet
              </h3>
              <p className="text-gray-600">
                This agent hasn't listed any properties yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
