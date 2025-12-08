import { motion } from "framer-motion";
import { Sparkles, ScanFace, Activity } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-sm bg-black/20 border-b border-white/5">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-tr from-pink-500 to-violet-500 rounded-lg shadow-lg shadow-pink-500/20">
                    <ScanFace className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                    Skin<span className="text-pink-500">Sight</span>
                </span>
            </div>

            <div className="hidden md:flex gap-8">
                {['Features', 'Technology', 'About'].map((item) => (
                    <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors relative group">
                        {item}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-500 transition-all group-hover:w-full" />
                    </a>
                ))}
            </div>

            <motion.a
                href="/auth"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2.5 bg-white text-black font-semibold rounded-full shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.5)] transition-shadow flex items-center gap-2"
            >
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span>Start Analysis</span>
            </motion.a>
        </nav>
    );
}
