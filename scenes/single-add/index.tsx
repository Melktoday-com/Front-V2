"use client";

import { Button } from "@/components/ui/Button";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { cn } from "@/lib/utils";
import {
    Bath,
    Bed,
    ChevronRight,
    Heart,
    MapPin,
    MessageCircle,
    Share2,
    Star,
    Wifi
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const mainImage = "https://www.figma.com/api/mcp/asset/d693cfef-5c0b-4f23-9620-7bcd0a7697db";
const galleryImages = [
    "https://www.figma.com/api/mcp/asset/39d18335-660a-4b97-9611-e5a0167e72aa",
    "https://www.figma.com/api/mcp/asset/f11753dd-babb-46f4-a35e-fefeed5a16c2",
    "https://www.figma.com/api/mcp/asset/c1ef6fad-2f26-402e-9240-d9b3f38145dc",
];

const reviews = [
    {
        id: 1,
        name: "کورت مولینز",
        image: "https://www.figma.com/api/mcp/asset/608c0ce8-233b-4b2d-be69-86566fd14cb1",
        rating: 5,
        date: "۸ روز پیش",
        comment: "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است."
    },
    {
        id: 2,
        name: "کی سوانسون",
        image: "https://www.figma.com/api/mcp/asset/0aa50e49-9fcf-4816-bb78-1ef513b445bd",
        rating: 4,
        date: "۱۲ روز پیش",
        comment: "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ."
    }
];

const nearbyAds = [
    {
        adId: "1",
        title: "برج وینگز",
        price: "۲۲۰",
        rating: 4.2,
        location: "جاکارتا، اندونزی",
        image: "https://www.figma.com/api/mcp/asset/f1244446-72bc-4bb8-969b-df195ddd18f6",
        category: "آپارتمان"
    },
    {
        adId: "2",
        title: "آپارتمان اسکای دندلاین",
        price: "۱۹۰",
        rating: 4.9,
        location: "جاکارتا، اندونزی",
        image: "https://www.figma.com/api/mcp/asset/2f68ab4c-a096-43e9-9b96-40102437a015",
        category: "آپارتمان"
    }
];

export default function SingleAdScene() {
    const [transactionType, setTransactionType] = useState<"rent" | "buy">("rent");
    const [isFavorite, setIsFavorite] = useState(true);

    return (
        <div className="flex flex-col pb-24 lg:pb-8">
            {/* Property Overview header */}
            <section className="relative w-full aspect-[375/524] lg:aspect-[16/7] px-6 pt-6">
                <div className="relative w-full h-full overflow-hidden rounded-[40px] lg:rounded-[50px] shadow-xl">
                    <Image
                        src={mainImage}
                        alt="Property Overview"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

                    {/* Top Bar */}
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
                        <button
                            onClick={() => window.history.back()}
                            className="w-[50px] h-[50px] bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-brand transition-all hover:bg-white"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="flex gap-4">
                            <button className="w-[50px] h-[50px] bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all hover:bg-white/40">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsFavorite(!isFavorite)}
                                className={cn(
                                    "w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all shadow-lg",
                                    isFavorite ? "bg-primary text-white" : "bg-white/20 backdrop-blur-md text-white hover:bg-white/40"
                                )}
                            >
                                <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
                            </button>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                        <div className="flex gap-3">
                            <div className="flex items-center gap-2 bg-brand/70 backdrop-blur-md text-white px-5 py-3 rounded-[25px]">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-sm font-bold">۴.۹</span>
                            </div>
                            <div className="bg-brand/70 backdrop-blur-md text-white px-5 py-3 rounded-[25px]">
                                <span className="text-sm font-bold">آپارتمان</span>
                            </div>
                        </div>

                        {/* Gallery Preview */}
                        <div className="flex flex-col gap-2">
                            {galleryImages.slice(0, 2).map((img, i) => (
                                <div key={i} className="relative w-[60px] h-[60px] border-2 border-white rounded-[18px] overflow-hidden">
                                    <Image src={img} alt="Gallery" fill className="object-cover" />
                                </div>
                            ))}
                            <div className="relative w-[60px] h-[60px] border-2 border-white rounded-[18px] overflow-hidden bg-brand/40 backdrop-blur-sm flex items-center justify-center">
                                <Image src={galleryImages[2]} alt="Gallery" fill className="object-cover opacity-60" />
                                <span className="relative z-10 text-white font-bold text-lg">+۳</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Info */}
            <section className="px-6 mt-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-brand font-black text-2xl lg:text-3xl">برج وینگز</h1>
                        <div className="flex items-center gap-1 mt-2 text-secondary">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">جاکارتا، اندونزی</span>
                        </div>
                    </div>
                    <div className="text-left">
                        <div className="text-brand font-black text-2xl lg:text-3xl line-clamp-1">$ ۲۲۰</div>
                        <div className="text-secondary text-xs mt-1">در هر ماه</div>
                    </div>
                </div>

                {/* Transaction Type & 360 */}
                <div className="flex justify-between items-center mt-8">
                    <div className="flex bg-soft-bg p-1 rounded-[20px] gap-1">
                        <button
                            onClick={() => setTransactionType("rent")}
                            className={cn(
                                "px-6 py-3 rounded-[20px] text-xs font-bold transition-all",
                                transactionType === "rent" ? "bg-primary text-white shadow-mdScale" : "text-brand"
                            )}
                        >
                            اجاره
                        </button>
                        <button
                            onClick={() => setTransactionType("buy")}
                            className={cn(
                                "px-6 py-3 rounded-[20px] text-xs font-bold transition-all",
                                transactionType === "buy" ? "bg-primary text-white shadow-md" : "text-brand"
                            )}
                        >
                            خرید
                        </button>
                    </div>
                    <button className="w-[50px] h-[50px] bg-soft-bg rounded-full flex flex-col items-center justify-center group hover:bg-primary transition-colors">
                        <span className="text-brand font-black text-[10px] group-hover:text-white">360°</span>
                    </button>
                </div>
            </section>

            {/* Owner Info */}
            <section className="px-6 mt-8">
                <div className="bg-soft-bg p-4 rounded-[25px] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative w-[50px] h-[50px] rounded-full overflow-hidden border-2 border-white">
                            <Image
                                src="https://www.figma.com/api/mcp/asset/376e2731-44dd-49d5-a571-bc96b8031d99"
                                alt="Agent"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <h3 className="text-brand font-bold text-sm">اندرسون</h3>
                            <p className="text-secondary text-[10px]">مشاور املاک</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center hover:bg-brand/90 transition-all">
                            <MessageCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Facilities */}
            <section className="px-6 mt-8 overflow-x-auto no-scrollbar">
                <div className="flex gap-3">
                    {[
                        { icon: Bed, label: "۲ اتاق خواب" },
                        { icon: Bath, label: "۱ سرویس" },
                        { icon: Wifi, label: "اینترنت" }
                    ].map((item, i) => (
                        <div key={i} className="flex-shrink-0 flex items-center gap-2 bg-soft-bg px-6 py-4 rounded-full">
                            <item.icon className="w-5 h-5 text-secondary" />
                            <span className="text-xs font-medium text-secondary whitespace-nowrap">{item.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Location & Public Facilities */}
            <section className="px-6 mt-10">
                <h2 className="text-brand font-black text-xl mb-4">موقعیت و امکانات رفاهی</h2>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-[50px] h-[50px] bg-soft-bg rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-secondary" />
                    </div>
                    <p className="text-secondary text-xs leading-relaxed">جاده سیکوکو شرقی، جاکارتا جنوبی، اندونزی ۱۲۷۷۰</p>
                </div>

                {/* Proximity info */}
                <div className="border border-soft-border rounded-[25px] p-4 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-secondary" />
                        <div className="flex items-center gap-1">
                            <span className="text-brand font-black text-sm">۲.۵</span>
                            <span className="text-brand font-black text-sm">کیلومتر</span>
                            <span className="text-secondary text-xs">از موقعیت شما</span>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-secondary rotate-90" />
                </div>

                {/* Map Preview */}
                <div className="relative w-full aspect-[327/235] rounded-[25px] overflow-hidden group">
                    <Image
                        src="https://www.figma.com/api/mcp/asset/eac6179f-e99c-4942-a213-b27f60186f8d"
                        alt="Map View"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-[50px] bg-white/50 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/70 transition-all">
                        <span className="text-brand text-xs font-bold">مشاهده همه روی نقشه</span>
                    </div>
                    {/* Custom Markers Placeholder */}
                    <div className="absolute top-1/2 left-1/3 -translate-y-1/2">
                        <div className="w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                            <MapPin className="w-4 h-4 text-white" />
                        </div>
                    </div>
                </div>

                {/* Nearby Facility Tags */}
                <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar">
                    {["۲ بیمارستان", "۴ پمپ بنزین", "۳ مدرسه"].map((tag, i) => (
                        <div key={i} className="flex-shrink-0 bg-soft-bg px-6 py-4 rounded-[20px]">
                            <span className="text-[10px] font-medium text-secondary whitespace-nowrap">{tag}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Cost of Living */}
            <section className="px-6 mt-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-brand font-black text-xl">هزینه زندگی</h2>
                    <Button variant="link" size="sm" className="text-primary text-[10px]">مشاهده جزئیات</Button>
                </div>
                <div className="bg-soft-bg p-4 rounded-[25px]">
                    <div className="flex items-baseline gap-1">
                        <span className="text-brand font-black text-lg">$ ۸۳۰</span>
                        <span className="text-secondary text-[10px] font-bold">/ماهانه*</span>
                    </div>
                    <p className="text-secondary text-[9px] mt-1">* میانگین هزینه شهروندان در این منطقه</p>
                </div>
            </section>

            {/* Reviews */}
            <section className="px-6 mt-10">
                <h2 className="text-brand font-black text-xl mb-4">نظرات</h2>
                <div className="bg-brand/10 p-4 rounded-[25px] flex items-center gap-6 mb-6">
                    <div className="w-14 h-14 bg-black/10 rounded-2xl flex items-center justify-center text-2xl">⭐</div>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex text-yellow-400">
                                {[1, 2, 3, 4].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                            </div>
                            <span className="text-lg font-black text-brand">۴.۹</span>
                        </div>
                        <p className="text-secondary text-[9px]">از ۱۱۲ نظردهنده</p>
                    </div>
                    <div className="flex -space-x-2 mr-auto rtl:space-x-reverse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="relative w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                                <Image src={`https://www.figma.com/api/mcp/asset/f0df5c7e-3253-4ed4-a4af-1434f961b48a`} alt="U" fill className="object-cover" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-soft-bg p-4 rounded-[25px]">
                            <div className="flex gap-3">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white">
                                    <Image src={review.image} alt={review.name} fill className="object-cover" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-brand font-bold text-xs">{review.name}</h4>
                                        <div className="flex text-yellow-400">
                                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className={cn("w-2.5 h-2.5", i > review.rating && "text-gray-300 fill-none")} />)}
                                        </div>
                                    </div>
                                    <p className="text-secondary text-[10px] mt-2 leading-relaxed">{review.comment}</p>
                                    <span className="text-gray-400 text-[8px] mt-2 block">{review.date}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <Button variant="secondary" className="w-full mt-4 h-12 rounded-[15px] border-none bg-soft-bg text-secondary text-[10px]">
                    مشاهده تمام نظرات
                </Button>
            </section>

            {/* Nearby Estates */}
            <section className="mt-10 mb-10">
                <div className="px-6 flex justify-between items-center mb-6">
                    <h2 className="text-brand font-black text-xl">املاک نزدیک این موقعیت</h2>
                    <Button variant="link" size="sm" className="text-secondary text-xs">مشاهده همه</Button>
                </div>
                <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar">
                    {nearbyAds.map((ad, i) => (
                        <div key={i} className="w-[180px] flex-shrink-0">
                            <PropertyCard
                                adId={ad.adId}
                                title={ad.title}
                                price={ad.price}
                                rating={ad.rating}
                                location={ad.location}
                                image={ad.image}
                                category={ad.category}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Floating Action Button / Buy Now */}
            <div className="fixed bottom-6 left-6 right-6 lg:static lg:px-6 lg:mt-12 z-50">
                <Button className="w-full h-[60px] rounded-[20px] shadow-xl shadow-primary/30">
                    تایید و پرداخت
                </Button>
            </div>
        </div>
    );
}
