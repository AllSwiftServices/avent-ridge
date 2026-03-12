import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export default function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 2, className = '' }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, current => 
    `${prefix}${current.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
  );
  const [displayValue, setDisplayValue] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return display.on('change', latest => {
      setDisplayValue(latest);
    });
  }, [display]);

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}