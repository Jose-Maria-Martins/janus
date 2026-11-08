import { motion } from 'motion/react';

/** Large green tick that draws itself, for success screens. */
export function SuccessTick() {
  return (
    <motion.svg
      viewBox="0 0 96 96"
      className="mx-auto size-24"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
    >
      <circle cx="48" cy="48" r="48" className="fill-success" />
      <motion.path
        d="M28 49 L42 63 L69 35"
        fill="none"
        stroke="#fff"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
      />
    </motion.svg>
  );
}
