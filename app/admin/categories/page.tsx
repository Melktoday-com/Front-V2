'use client';

import { adminService } from "@/services/admin.service";
import { adsService } from "@/services/ads.service";
import { CategoryListItem } from "@/types/api/ads.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Archive,
    ChevronDown,
    ChevronRight,
    Edit2,
    Layers,
    Plus,
    PlusCircle,
    Search,
    Trash2,
    X
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);

    // Form states
    const [selectedCategory, setSelectedCategory] = useState<CategoryListItem | null>(null);
    const [formData, setFormData] = useState({ key: "", displayName: "" });
    const [subcategoryData, setSubcategoryData] = useState({ key: "", displayName: "" });

    // Fetch Categories
    const { data: categories, isLoading } = useQuery({
        queryKey: ["admin", "categories"],
        queryFn: () => adsService.listCategories(),
    });

    const toggleExpand = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const createCategoryMutation = useMutation({
        mutationFn: (data: { key: string, displayName: string }) => adminService.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
            toast.success("دسته بندی جدید با موفقیت ایجاد شد");
            setIsCreateModalOpen(false);
            setFormData({ key: "", displayName: "" });
        },
        onError: () => toast.error("خطا در ایجاد دسته بندی")
    });

    const updateCategoryMutation = useMutation({
        mutationFn: (data: { id: string, displayName: string }) => adminService.updateCategory(data.id, { displayName: data.displayName }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
            toast.success("دسته بندی با موفقیت بروزرسانی شد");
            setIsEditModalOpen(false);
            setSelectedCategory(null);
        },
        onError: () => toast.error("خطا در بروزرسانی دسته بندی")
    });

    const archiveCategoryMutation = useMutation({
        mutationFn: (id: string) => adminService.archiveCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
            toast.success("دسته بندی با موفقیت آرشیو شد");
        },
        onError: () => toast.error("خطا در آرشیو دسته بندی")
    });

    const addSubcategoryMutation = useMutation({
        mutationFn: (data: { categoryId: string, key: string, displayName: string }) =>
            adminService.addSubcategory(data.categoryId, { subcategoryKey: data.key, displayName: data.displayName }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
            toast.success("زیردسته جدید با موفقیت اضافه شد");
            setIsSubcategoryModalOpen(false);
            setSubcategoryData({ key: "", displayName: "" });
        },
        onError: () => toast.error("خطا در اضافه کردن زیردسته")
    });

    const archiveSubcategoryMutation = useMutation({
        mutationFn: (data: { categoryId: string, subcategoryKey: string }) =>
            adminService.archiveSubcategory(data.categoryId, data.subcategoryKey),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
            toast.success("زیردسته با موفقیت آرشیو شد");
        },
        onError: () => toast.error("خطا در آرشیو زیردسته")
    });

    const filteredCategories = categories?.filter(c =>
        c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-8 h-8 text-blue-600" />
                        مدیریت دسته‌بندی‌ها
                    </h1>
                    <p className="text-slate-500 mt-1 uppercase text-xs tracking-wider font-semibold">
                        Category & Subcategory Management
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-200"
                    >
                        <Plus className="w-5 h-5" />
                        دسته‌بندی جدید
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="جستجو در دسته‌بندی‌ها (نام یا کلید)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                </div>
            </div>

            {/* Categories List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium">در حال بارگذاری دسته‌بندی‌ها...</p>
                    </div>
                ) : filteredCategories?.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <p className="text-slate-400">هیچ دسته‌بندی یافت نشد</p>
                    </div>
                ) : (
                    filteredCategories?.map((category) => (
                        <div key={category.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-blue-200">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleExpand(category.id)}
                                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        {expandedCategories.includes(category.id) ? (
                                            <ChevronDown className="w-5 h-5 text-slate-500" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-slate-500" />
                                        )}
                                    </button>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{category.displayName}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono uppercase tracking-tighter">
                                                {category.key}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium border-r pr-2 mr-2 border-slate-200">
                                                {category.subcategories?.length || 0} زیردسته
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setIsSubcategoryModalOpen(true);
                                        }}
                                        className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-600 h-8 px-3 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        افزودن زیردسته
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setFormData({ key: category.key, displayName: category.displayName });
                                            setIsEditModalOpen(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`آیا از آرشیو کردن دسته‌بندی "${category.displayName}" اطمینان دارید؟`)) {
                                                archiveCategoryMutation.mutate(category.id);
                                            }
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Subcategories (Expanded) */}
                            {expandedCategories.includes(category.id) && (
                                <div className="bg-slate-50/50 border-t border-slate-100 p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {category.subcategories?.length === 0 ? (
                                            <p className="text-sm text-slate-400 italic py-2 col-span-full text-center">
                                                زیردسته‌ای برای این دسته‌بندی تعریف نشده است
                                            </p>
                                        ) : (
                                            category.subcategories.map((sub) => (
                                                <div key={sub.key} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between group">
                                                    <div>
                                                        <span className="text-sm font-semibold text-slate-800">{sub.displayName}</span>
                                                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{sub.key}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`آیا از آرشیو کردن زیردسته "${sub.displayName}" اطمینان دارید؟`)) {
                                                                archiveSubcategoryMutation.mutate({ categoryId: category.id, subcategoryKey: sub.key });
                                                            }
                                                        }}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Create Category Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">ایجاد دسته‌بندی جدید</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">نام نمایشی (فارسی)</label>
                                <input
                                    type="text"
                                    placeholder="مثلاً: املاک مسکونی"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">کلید (Key - انگلیسی)</label>
                                <input
                                    type="text"
                                    placeholder="مثلاً: residential"
                                    value={formData.key}
                                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">این کلید در دیتابیس و آدرس‌ها استفاده می‌شود و قابل تغییر نیست.</p>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 flex items-center gap-3">
                            <button
                                onClick={() => createCategoryMutation.mutate(formData)}
                                disabled={!formData.key || !formData.displayName || createCategoryMutation.isPending}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-all disabled:opacity-50"
                            >
                                {createCategoryMutation.isPending ? "در حال ایجاد..." : "ایجاد دسته‌بندی"}
                            </button>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-6 py-3 font-semibold text-slate-500 hover:bg-slate-200 rounded-2xl transition-all"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {isEditModalOpen && selectedCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">ویرایش دسته‌بندی</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">کلید (غیرقابل تغییر)</label>
                                <input
                                    type="text"
                                    value={selectedCategory.key}
                                    disabled
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm text-slate-400 uppercase tracking-tighter"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">نام نمایشی جدید</label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 flex items-center gap-3">
                            <button
                                onClick={() => updateCategoryMutation.mutate({ id: selectedCategory.id, displayName: formData.displayName })}
                                disabled={!formData.displayName || updateCategoryMutation.isPending || formData.displayName === selectedCategory.displayName}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-all disabled:opacity-50"
                            >
                                {updateCategoryMutation.isPending ? "در حال بروزرسانی..." : "بروزرسانی تغییرات"}
                            </button>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-6 py-3 font-semibold text-slate-500 hover:bg-slate-200 rounded-2xl transition-all"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subcategory Modal */}
            {isSubcategoryModalOpen && selectedCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">افزودن زیردسته به {selectedCategory.displayName}</h3>
                            <button onClick={() => setIsSubcategoryModalOpen(false)} className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">نام نمایشی زیردسته</label>
                                <input
                                    type="text"
                                    placeholder="مثلاً: آپارتمان"
                                    value={subcategoryData.displayName}
                                    onChange={(e) => setSubcategoryData({ ...subcategoryData, displayName: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">کلید زیردسته (انگلیسی)</label>
                                <input
                                    type="text"
                                    placeholder="مثلاً: apartment"
                                    value={subcategoryData.key}
                                    onChange={(e) => setSubcategoryData({ ...subcategoryData, key: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 flex items-center gap-3">
                            <button
                                onClick={() => addSubcategoryMutation.mutate({ categoryId: selectedCategory.id, ...subcategoryData })}
                                disabled={!subcategoryData.key || !subcategoryData.displayName || addSubcategoryMutation.isPending}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-all disabled:opacity-50"
                            >
                                {addSubcategoryMutation.isPending ? "در حال ایجاد..." : "اضافه کردن زیردسته"}
                            </button>
                            <button
                                onClick={() => setIsSubcategoryModalOpen(false)}
                                className="px-6 py-3 font-semibold text-slate-500 hover:bg-slate-200 rounded-2xl transition-all"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
