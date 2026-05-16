import { notFound } from "next/navigation";
import { Role } from "@/types/user";
import { properties } from "@/data/properties";
import { dummyUsers } from "@/data/users";
import LandlordClient from "../_components/LandlordClient";

export default async function LandlordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const landlord = dummyUsers.find(
    (l) => l._id === id && l.roles.includes(Role.Landlord),
  );

  if (!landlord) notFound();

  const listings = properties.filter(
    (p) => p.ownerId._id === id && p.ownerType === "landlord",
  );

  return <LandlordClient landlord={landlord} listings={listings} />;
}
