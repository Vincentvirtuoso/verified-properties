"use client";
import { useEffect, useState } from "react";

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-2 md:gap-4 justify-center lg:justify-start items-center mt-4">
      <TimeUnit val={timeLeft.days} label="Days" />
      <span className="text-white font-bold animate-pulse">:</span>
      <TimeUnit val={timeLeft.hours} label="Hrs" />
      <span className="text-white font-bold animate-pulse">:</span>
      <TimeUnit val={timeLeft.mins} label="Min" />
      <span className="text-white font-bold animate-pulse">:</span>
      <TimeUnit val={timeLeft.secs} label="Sec" />
    </div>
  );
};

export default CountdownTimer;

const TimeUnit = ({ val, label }: { val: number; label: string }) => (
  <div className="flex flex-col items-center px-3 py-2 min-w-17.5">
    <span className="text-2xl md:text-3xl font-black text-white tabular-nums leading-none">
      {val.toString().padStart(2, "0")}
    </span>
    <span className="text-[10px] uppercase font-bold tracking-widest text-primary-foreground/70 mt-1">
      {label}
    </span>
  </div>
);
