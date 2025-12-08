import { motion } from "framer-motion";
import { ArrowRight, Fingerprint, Microscope, ShieldCheck } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-black">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[128px] mix-blend-screen animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[128px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100" />
            </div>

            <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                        </span>
                        <span className="text-xs font-medium text-pink-300 uppercase tracking-wider">AI Powered Analysis</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
                        Reveal Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-indigo-400">
                            True Radiance
                        </span>
                    </h1>

                    <p className="text-zinc-400 text-lg md:text-xl mb-8 max-w-lg leading-relaxed">
                        Professional-grade skin analysis powered by advanced AI. Detect metrics like acne, hydration, and age with just a selfie.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-4 bg-gradient-to-r from-pink-600 to-indigo-600 rounded-xl font-bold text-white shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 group"
                        >
                            Start Free Scan
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-white hover:bg-white/10 transition-colors backdrop-blur-sm"
                        >
                            View Demo
                        </motion.button>
                    </div>

                    <div className="mt-12 flex gap-8 border-t border-white/10 pt-8">
                        <FeatureStat icon={<Microscope className="w-5 h-5 text-pink-400" />} label="Precision" value="98.5%" />
                        <FeatureStat icon={<Fingerprint className="w-5 h-5 text-indigo-400" />} label="Privacy" value="Local-First" />
                        <FeatureStat icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />} label="Security" value="Encrypted" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative hidden lg:block"
                >
                    <div className="relative z-10 p-2 bg-gradient-to-b from-white/10 to-transparent rounded-3xl border border-white/20 backdrop-blur-md">
                        <img
                            src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=2670&auto=format&fit=crop"
                            alt="Face Scan Visualization"
                            className="rounded-2xl shadow-2xl grayscale-[0.2] contrast-125"
                        />

                        {/* Floating UI Elements */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1.2 }}
                            className="absolute top-10 right-[-20px] p-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl flex gap-3 items-center"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                <span className="text-green-400 text-lg font-bold">98</span>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400">Overall Score</p>
                                <p className="text-sm font-bold text-white">Excellent</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Decorative Grid */}
                    <div className="absolute -inset-4 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] z-0 mask-image-radial" />
                </motion.div>
            </div>
        </section>
    );
}

function FeatureStat({ icon, label, value }) {
    return (
        <div className="flex gap-3 items-center">
            <div className="p-2 bg-white/5 rounded-lg">
                {icon}
            </div>
            <div>
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</div>
            </div>
        </div>
    )
}
