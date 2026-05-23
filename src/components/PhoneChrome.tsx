import { useEffect, useState } from "react";
import { Signal, Wifi, BatteryFull } from "lucide-react";

const formatTime = (d: Date) =>
 d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(" ", "");

export const StatusBar = () => {
 const [time, setTime] = useState(() => formatTime(new Date()));

 useEffect(() => {
 const id = window.setInterval(() => setTime(formatTime(new Date())), 30_000);
 return () => window.clearInterval(id);
 }, []);

 return (
 <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-[env(safe-area-inset-top,0px)] min-h-[30px] items-end">
 <div className="flex w-full items-center justify-between px-6 pb-1 text-[13px] font-semibold tracking-tight text-foreground">
 <span className="tabular-nums">{time}</span>
 <div className="flex items-center gap-1.5">
 <Signal className="h-[13px] w-[13px]" strokeWidth={2.5} />
 <Wifi className="h-[13px] w-[13px]" strokeWidth={2.5} />
 <BatteryFull className="h-[15px] w-[15px]" strokeWidth={2} />
 </div>
 </div>
 </div>
 );
};

export const HomeIndicator = () => (
 <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center pb-1.5">
 <span className="h-[5px] w-[134px] rounded-full bg-foreground" />
 </div>
);
