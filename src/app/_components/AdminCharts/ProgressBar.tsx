import { motion } from "framer-motion";

const ProgressBar = ({ label, value }: { label: string; value: number }) => {
  const clamped = Math.min(100, value); // cap at 100%

  return (
    <div className="mb-4">
      <p className="mb-1 text-sm font-medium">
        {label}:{" "}
        <span
          className={
            value < 20
              ? "text-red-500"
              : value < 60
                ? "text-yellow-500"
                : "text-green-500"
          }
        >
          {value.toFixed(1)}%
        </span>
      </p>
      <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
        <motion.div
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
