import { PropsWithChildren } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimatedPageProps = PropsWithChildren<{
  className?: string;
  delay?: number;
}>;

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export const AnimatedPage = ({ children, className, delay = 0 }: AnimatedPageProps) => {
  return (
    <motion.div
      className={cn("min-h-full", className)}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
};


