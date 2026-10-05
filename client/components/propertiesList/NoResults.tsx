import { motion } from 'framer-motion'
import { FiSearch } from 'react-icons/fi';

export function NoResults({
  search,
  onClear,
}: {
  search: string;
  onClear: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground">
        <FiSearch size={20} />
      </div>

      <h2 className="font-semibold text-foreground">
        No saved properties found
      </h2>

      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {search
          ? `We couldn't find anything matching "${search}".`
          : "Try changing your current filter."}
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-5 text-sm font-semibold text-primary hover:underline"
      >
        Clear filters
      </button>
    </motion.div>
  );
}