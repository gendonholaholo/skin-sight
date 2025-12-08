import clsx from "clsx";

export default function MetricCard({ title, score, level, icon: Icon, color = "pink" }) {
    const getScoreColor = (s) => {
        if (s >= 80) return "text-emerald-400";
        if (s >= 50) return "text-yellow-400";
        return "text-red-400";
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
                <div className={clsx("p-2 rounded-lg bg-opacity-20", `bg-${color}-500/20 text-${color}-400`)}>
                    {Icon && <Icon className="w-5 h-5" />}
                </div>
                <span className={clsx("text-xl font-bold", getScoreColor(score))}>{score}</span>
            </div>
            <div>
                <h4 className="text-zinc-300 font-medium">{title}</h4>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">{level}</p>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                <div
                    className={clsx("h-full rounded-full transition-all duration-1000", `bg-${color}-500`)}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}
