import React from "react";

const SectionLabel = ({ text }: { text: string }) => {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-4 text-xs text-gray-500 uppercase tracking-widest">
          {text}
        </span>
      </div>
    </div>
  );
};

export default SectionLabel;
