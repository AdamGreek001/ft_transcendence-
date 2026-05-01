"use client";

import { useState } from "react";

interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: number;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLImageElement | HTMLDivElement>;
}

export function Avatar({ src, alt = "User avatar", size = 40, className = "", onClick }: AvatarProps) {
    const [imgError, setImgError] = useState(false);

    if (src && !imgError) {
        return (
            <img
                src={src}
                alt={alt}
                width={size}
                height={size}
                onClick={onClick}
                onError={() => setImgError(true)}
                className={`rounded-full object-cover ${className}`}
                style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px`, display: "block" }}
            />
        );
    }

    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold ${className}`}
            style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px`, fontSize: size * 0.4 }}
        >
            {alt.charAt(0).toUpperCase()}
        </div>
    );
}
