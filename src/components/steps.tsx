/** step indicator บอกลำดับขั้นตอนให้ลูกค้า — current = index ของขั้นที่กำลังทำอยู่ (ผ่านครบส่ง labels.length) */
export function Steps({ labels, current }: { labels: string[]; current: number }) {
  return (
    <div className="flex w-full items-start">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <div className={`h-[2px] flex-1 rounded ${i === 0 ? "opacity-0" : i <= current ? "bg-red-500" : "bg-neutral-200"}`} />
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  done
                    ? "bg-red-500 text-white"
                    : active
                      ? "border-2 border-red-500 bg-white text-red-600"
                      : "border border-neutral-300 bg-white text-neutral-400"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <div className={`h-[2px] flex-1 rounded ${i === labels.length - 1 ? "opacity-0" : i < current ? "bg-red-500" : "bg-neutral-200"}`} />
            </div>
            <span className={`px-0.5 text-center text-[11px] leading-tight ${active ? "font-semibold text-red-600" : done ? "font-medium text-neutral-700" : "text-neutral-400"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
