import { X, MessageCircle, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationToastProps {
    title: string;
    message: string;
    image?: string;
    type?: 'success' | 'error' | 'info' | 'chat';
    onClose: () => void;
}

export default function NotificationToast({ title, message, image, type = 'info', onClose }: NotificationToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    // Theme Configuration
    const confirmStyles = {
        chat: {
            border: "border-[#14FFEC]/30",
            bg: "bg-[#1E1E1E]/95",
            accent: "from-[#14FFEC] to-[#0D7377]",
            textTitle: "text-[#14FFEC]",
            iconBg: "bg-[#14FFEC]/10",
            iconText: "text-[#14FFEC]",
            Icon: MessageCircle
        },
        success: {
            border: "border-green-500/30",
            bg: "bg-[#1E1E1E]/95",
            accent: "from-green-400 to-green-700",
            textTitle: "text-green-400",
            iconBg: "bg-green-500/10",
            iconText: "text-green-400",
            Icon: CheckCircle
        },
        error: {
            border: "border-red-500/30",
            bg: "bg-[#1E1E1E]/95",
            accent: "from-red-400 to-red-700",
            textTitle: "text-red-400",
            iconBg: "bg-red-500/10",
            iconText: "text-red-400",
            Icon: AlertCircle
        },
        info: {
            border: "border-blue-500/30",
            bg: "bg-[#1E1E1E]/95",
            accent: "from-blue-400 to-blue-700",
            textTitle: "text-blue-400",
            iconBg: "bg-blue-500/10",
            iconText: "text-blue-400",
            Icon: Info
        }
    };

    const style = confirmStyles[type] || confirmStyles.info;
    const IconComponent = style.Icon;

    return (
        <div
            className={`
                flex items-start gap-4 p-4 rounded-xl shadow-2xl backdrop-blur-md
                w-80 md:w-96 cursor-pointer hover:bg-[#323232]/90 transition-all duration-300
                ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"}
                text-white relative overflow-hidden group border ${style.border} ${style.bg}
            `}
            onClick={() => { if (type === 'chat') { /* TODO navigate */ } }}
        >
            {/* ACCENT LINE */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${style.accent}`}></div>

            {/* AVATAR / ICON */}
            {image ? (
                <div className={`mt-1 w-10 h-10 rounded-full overflow-hidden border-2 ${style.border} shrink-0`}>
                    <img src={image} alt="" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className={`mt-1 p-2 rounded-full ${style.iconBg} ${style.iconText} w-10 h-10 flex items-center justify-center shrink-0`}>
                    <IconComponent size={20} />
                </div>
            )}

            {/* CONTENT */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h4 className={`font-bold ${style.textTitle} text-sm truncate pr-2`}>{title}</h4>
                    <span className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase">{type === 'chat' ? 'Just Now' : type}</span>
                </div>
                <p className="text-gray-300 text-sm mt-1 line-clamp-2 leading-relaxed opacity-90">
                    {message}
                </p>
            </div>

            {/* CLOSE BUTTON */}
            <button
                onClick={(e) => { e.stopPropagation(); setIsVisible(false); setTimeout(onClose, 300); }}
                className="text-gray-500 hover:text-white transition-colors absolute top-2 right-2 opacity-0 group-hover:opacity-100"
            >
                <X size={16} />
            </button>
        </div>
    );
}
