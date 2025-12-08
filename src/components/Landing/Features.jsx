import { motion } from "framer-motion";
import { Gauge, Users, Zap, Shield, FileText, Camera } from "lucide-react";

const features = [
    {
        icon: <Gauge className="w-6 h-6 text-pink-400" />,
        title: "Instant Analysis",
        description: "Get comprehensive skin metrics in under 2 seconds using our optimized AI models."
    },
    {
        icon: <Camera className="w-6 h-6 text-indigo-400" />,
        title: "Liveness Check",
        description: "Advanced anti-spoofing technology ensures the scan is from a real, live person."
    },
    {
        icon: <FileText className="w-6 h-6 text-emerald-400" />,
        title: "Detailed Reports",
        description: "Download professional PDF reports summarizing your skin health and recommendations."
    },
    {
        icon: <Shield className="w-6 h-6 text-amber-400" />,
        title: "Privacy First",
        description: "All analysis happens locally or securely. Your biometric data never leaves the encryption layer."
    },
    {
        icon: <Zap className="w-6 h-6 text-cyan-400" />,
        title: "Real-time Tracking",
        description: "Track changes in your skin health over time with our historical dashboard."
    },
    {
        icon: <Users className="w-6 h-6 text-rose-400" />,
        title: "Expert Insights",
        description: "Receive AI-generated tips tailored specifically to your skin type and identified issues."
    }
];

export default function Features() {
    return (
        <section id="features" className="py-24 bg-black relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-pink-900/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-900/10 rounded-full blur-[100px]" />

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="text-sm font-semibold text-pink-500 uppercase tracking-widest">Why Choose SkinSight</span>
                    <h2 className="mt-3 text-4xl md:text-5xl font-bold text-white">
                        Professional Grade <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400">
                            Technology at Home
                        </span>
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
