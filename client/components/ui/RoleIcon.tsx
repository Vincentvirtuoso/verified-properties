import { Role } from "@/types";
import { LuUser } from "react-icons/lu";
import { MdBusiness, MdRealEstateAgent } from "react-icons/md";
import { HiOutlineLocationMarker } from "react-icons/hi";

const roleIconMap: Record<Role, React.ComponentType<{ className?: string }>> = {
  [Role.Viewer]: HiOutlineLocationMarker,
  [Role.Agent]: MdRealEstateAgent,
  [Role.Company]: MdBusiness,
};

interface RoleIconProps {
  role: Role;
  className?: string;
}

const RoleIcon = ({ role, className = "w-4 h-4" }: RoleIconProps) => {
  const Icon = roleIconMap[role] || LuUser;
  return <Icon className={className} />;
};

export default RoleIcon;
