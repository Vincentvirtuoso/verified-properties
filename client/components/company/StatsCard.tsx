import { motion } from "framer-motion";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function StatsCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="text-xl font-semibold tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}
