"use client";

import { adminService } from "@/services/admin.service";
import { BroadcastNotificationRequest } from "@/types/api/admin.types";
import { useMutation } from "@tanstack/react-query";
import { Bell, Info, Send, Smartphone, Users } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

type AudienceType = "ALL" | "AGENTS" | "HOSTS" | "USERS";

export default function AdminNotificationsPage() {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [audience, setAudience] = useState<AudienceType>("ALL");

    const broadcastMutation = useMutation({
        mutationFn: (data: BroadcastNotificationRequest) => adminService.broadcastNotification(data),
        onSuccess: () => {
            toast.success("اطلاعیه با موفقیت برای تمامی کاربران هدف ارسال شد");
            setTitle("");
            setBody("");
        },
        onError: () => toast.error("خطا در ارسال اطلاعیه")
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !body) {
            toast.error("عنوان و متن اطلاعیه الزامی است");
            return;
        }
        broadcastMutation.mutate({
            title,
            body,
            audience: {
                roles: audience === "ALL" ? undefined : [audience === "AGENTS" ? "agent" : audience === "HOSTS" ? "manager" : "user"]
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">ارسال اطلاعیه همگانی</h1>
                <p className="text-gray-500 font-medium">ارسال مستقیم Push Notification به اپلیکیشن و پنل کاربران</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 text-white relative overflow-hidden">
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold">ارسال برای {audience === 'ALL' ? 'همه کاربران' : audience === 'AGENTS' ? 'مشاورین املاک' : audience === 'HOSTS' ? 'میزبانان اجاره روزانه' : 'کاربران عادی'}</h3>
                            <p className="text-indigo-100 opacity-80 text-sm italic">ارسال پیام مستقیم سیستمی</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                            <Bell size={32} className="text-white" />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSend} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-700 block">انتخاب گروه مخاطبان</label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { id: "ALL", label: "همه کاربران", icon: Users },
                                { id: "AGENTS", label: "مشاورین املاک", icon: Smartphone },
                                { id: "HOSTS", label: "میزبانان", icon: Bell },
                                { id: "USERS", label: "کاربران عادی", icon: Users },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setAudience(item.id as AudienceType)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${audience === item.id ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-100" : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"}`}
                                >
                                    <item.icon size={20} />
                                    <span className="text-xs font-bold">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">عنوان اطلاعیه</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="مثلا: به‌روزرسانی قوانین سایت"
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">متن پیام</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={5}
                                placeholder="پیام خود را اینجا بنویسید..."
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-700 text-sm">
                        <Info className="flex-shrink-0 mt-0.5" size={18} />
                        <p>
                            پیام شما به محض کلیک روی دکمه ارسال، برای تمامی کاربران گروه هدف ارسال خواهد شد.
                            امکان لغو عملیات وجود ندارد.
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={broadcastMutation.isPending}
                            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                        >
                            <Send size={20} />
                            {broadcastMutation.isPending ? "در حال ارسال..." : "ارسال اطلاعیه"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
