import { motion } from "framer-motion";
import { Users, Heart, Globe } from "lucide-react";

export default function About() {
    return (
        <section id="about" className="py-24 bg-black relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-900/10 rounded-full blur-[128px]" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[128px]" />

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-500">Mission</span>
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                        We're democratizing professional-grade skin analysis. Using advanced AI, we help you understand your skin better, completely free and private.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    <AboutCard
                        icon={<Users className="w-8 h-8 text-pink-500" />}
                        title="User First"
                        description="Designed for real people with real skin concerns. No complex jargon, just clear actionable insights."
                    />
                    <AboutCard
                        icon={<Heart className="w-8 h-8 text-rose-500" />}
                        title="Holistic Approach"
                        description="We look beyond the surface. Our AI considers hydration, age, and fatigue to give a complete picture."
                    />
                    <AboutCard
                        icon={<Globe className="w-8 h-8 text-indigo-500" />}
                        title="Accessible to All"
                        description="Professional skin analysis typically costs hundreds. SkinSight brings it to your phone for free."
                    />
                </div>
            </div>
        </section>
    );
}

function AboutCard({ icon, title, description }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="p-8 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-900/80 transition-all hover:border-pink-500/20"
        >
            <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-zinc-400 leading-relaxed">{description}</p>
        </motion.div>
    );
}
