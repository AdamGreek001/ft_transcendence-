interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: number;
    className?: string;
}

export function Avatar({ src, alt = "User avatar", size = 40, className = "" }: AvatarProps) {
    if (src) {
        return (
            <img
                src={src}
                alt={alt}
                width={size}
                height={size}
                className={`rounded-full object-cover ${className}`}
                style={{ width: size, height: size }}
            />
        );
    }

    return (
        <div
            className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold ${className}`}
            style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
            {alt.charAt(0).toUpperCase()}
        </div>
    );
}
