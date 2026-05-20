import { Role } from "@/types";
import {
  LuEye,
  LuUserCheck,
  LuHouse,
  LuCode,
  LuBuilding2,
  LuUser,
} from "react-icons/lu";

const roleIconMap: Record<Role, React.ComponentType<{ className?: string }>> = {
  [Role.Viewer]: LuEye,
  [Role.Agent]: LuUserCheck,
  [Role.Landlord]: LuHouse,
  [Role.Developer]: LuCode,
  [Role.Company]: LuBuilding2,
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
