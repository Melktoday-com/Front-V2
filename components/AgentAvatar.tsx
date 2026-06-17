import Image from "next/image";

interface AgentAvatarProps {
    name: string;
    image: string;
}

export function AgentAvatar({ name, image }: AgentAvatarProps) {
    return (
        <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="relative w-[70px] h-[70px] lg:w-[90px] lg:h-[90px] rounded-full overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-110 group-hover:border-primary group-hover:shadow-md">
                <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover"
                />
            </div>
            <span className="text-[10px] lg:text-xs text-brand font-black transition-colors group-hover:text-primary whitespace-nowrap">{name}</span>
        </div>
    );
}
