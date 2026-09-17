'use client';

import PriceModelsModal from "@/components/admin/PriceModelsModal";
import SubcategoryConfigModal from "@/components/admin/SubcategoryConfigModal";
import { adminService } from "@/services/admin.service";
import { TemporaryRentCategory, TemporaryRentSubcategory } from "@/types/api/temporary-rent.types";
import {
    CreateAdminCategoryRequest,
    UpdateAdminCategoryRequest,
    CreateAdminSubcategoryRequest,
    UpdateAdminSubcategoryRequest,
} from "@/types/api/admin.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Archive,
    Calendar,
    ChevronDown,
    ChevronRight,
    Coins,
    Edit2,
    Plus,
    PlusCircle,
    Search,
    Sliders,
    Tag,
    Trash2,
    X
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

export default function AdminTemporaryRentCategoriesPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    // Modal states
    const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
    const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
    const [isCreateSubcategoryModalOpen, setIsCreateSubcategoryModalOpen] = useState(false);
    const [isEditSubcategoryModalOpen, setIsEditSubcategoryModalOpen] = useState(false);
    const [isSubcategoryConfigOpen, setIsSubcategoryConfigOpen] = useState(false);
    const [isPriceModelsModalOpen, setIsPriceModelsModalOpen] = useState(false);

    // Selected objects
    const [selectedCategory, setSelectedCategory] = useState<TemporaryRentCategory | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<TemporaryRentSubcategory | null>(null);

    // Category form state
    const [categoryForm, setCategoryForm] = useState({
        key: "",
        displayName: "",
        description: "",
        icon: "",
        banner: "",
        displayOrder: 1,
        isActive: true,
    });

    // Subcategory form state
    const [subcategoryForm, setSubcategoryForm] = useState({
        key: "",
        displayName: "",
        description: "",
        icon: "",
        banner: "",
        displayOrder: 1,
        isActive: true,
    });

    // Fetch Categories
    const { data: categoriesResponse, isLoading } = useQuery({
        queryKey: ["admin", "temporary-rent", "categories"],
        queryFn: () => adminService.listTemporaryRentCategories({ includeArchived: false }),
    });

    const categories: TemporaryRentCategory[] = Array.isArray(categoriesResponse)
        ? categoriesResponse
        : [];

    const toggleExpand = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // Category Mutations
    const createCategoryMutation = useMutation({
        mutationFn: (data: CreateAdminCategoryRequest) => adminService.createTemporaryRentCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "temporary-rent", "categories"] });
            toast.success("دسته‌بندی اقامتگاه با موفقیت ایجاد شد");
            setIsCreateCategoryModalOpen(false);
        },
        onError: (err: unknown) => {
            const errorObj = err as { response?: { data?: { message?: string } } };
            const msg = errorObj?.response?.data?.message || "خطا در ایجاد دسته‌بندی";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    });

    const updateCategoryMutation = useMutation({
        mutationFn: (data: { id: string; payload: UpdateAdminCategoryRequest }) => adminService.updateTemporaryRentCategory(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "temporary-rent", "categories"] });
            toast.success("دسته‌بندی با موفقیت بروزرسانی شد");
            setIsEditCategoryModalOpen(false);
            setSelectedCategory(null);
        },
        onError: (err: unknown) => {
            const errorObj = err as { response?: { data?: { message?: string } } };
            const msg = errorObj?.response?.data?.message || "خطا در بروزرسانی دسته‌بندی";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    });

    const archiveCategoryMutation = useMutation({
        mutationFn: (id: string) => adminService.archiveTemporaryRentCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "temporary-rent", "categories"] });
            toast.success("دسته‌بندی با موفقیت آرشیو شد");
        },
        onError: () => toast.error("خطا در آرشیو دسته‌بندی")
    });

    // Subcategory Mutations
    const createSubcategoryMutation = useMutation({
        mutationFn: (data: { categoryId: string; payload: CreateAdminSubcategoryRequest }) =>
            adminService.addTemporaryRentSubcategory(data.categoryId, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "temporary-rent", "categories"] });
            toast.success("زیردسته اقامتگاه با موفقیت ایجاد شد");
            setIsCreateSubcategoryModalOpen(false);
        },
        onError: (err: unknown) => {
            const errorObj = err as { response?: { data?: { message?: string } } };
            const msg = errorObj?.response?.data?.message || "خطا در ایجاد زیردسته";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    });

    const updateSubcategoryMutation = useMutation({
        mutationFn: (data: { subcategoryId: string; payload: UpdateAdminSubcategoryRequest }) =>
            adminService.updateTemporaryRentSubcategory(data.subcategoryId, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "temporary-rent", "categories"] });
            toast.success("زیردسته با موفقیت بروزرسانی شد");
            setIsEditSubcategoryModalOpen(false);
            setSelectedSubcategory(null);
        },
        onError: (err: unknown) => {
            const errorObj = err as { response?: { data?: { message?: string } } };
            const msg = errorObj?.response?.data?.message || "خطا در بروزرسانی زیردسته";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    });

    const archiveSubcategoryMutation = useMutation({
        mutationFn: (subcategoryId: string) =>
            adminService.archiveTemporaryRentSubcategory(subcategoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "temporary-rent", "categories"] });
            toast.success("زیردسته با موفقیت آرشیو شد");
        },
        onError: () => toast.error("خطا در آرشیو زیردسته")
    });

    // Handlers
    const handleOpenCreateCategory = () => {
        setCategoryForm({
            key: "",
            displayName: "",
            description: "",
            icon: "",
            banner: "",
            displayOrder: (categories.length || 0) + 1,
            isActive: true,
        });
        setIsCreateCategoryModalOpen(true);
    };

    const handleOpenEditCategory = (cat: TemporaryRentCategory) => {
        setSelectedCategory(cat);
        setCategoryForm({
            key: cat.key,
            displayName: cat.displayName,
            description: cat.description || "",
            icon: cat.icon || "",
            banner: cat.banner || "",
            displayOrder: cat.displayOrder ?? 1,
            isActive: cat.isActive ?? true,
        });
        setIsEditCategoryModalOpen(true);
    };

    const handleOpenCreateSubcategory = (cat: TemporaryRentCategory) => {
        setSelectedCategory(cat);
        setSubcategoryForm({
            key: "",
            displayName: "",
            description: "",
            icon: "",
            banner: "",
            displayOrder: (cat.subcategories?.length || 0) + 1,
            isActive: true,
        });
        setIsCreateSubcategoryModalOpen(true);
    };

    const handleOpenEditSubcategory = (cat: TemporaryRentCategory, sub: TemporaryRentSubcategory) => {
        setSelectedCategory(cat);
        setSelectedSubcategory(sub);
        setSubcategoryForm({
            key: sub.key,
            displayName: sub.displayName,
            description: sub.description || "",
            icon: sub.icon || "",
            banner: sub.banner || "",
            displayOrder: sub.displayOrder ?? 1,
            isActive: sub.isActive ?? true,
        });
        setIsEditSubcategoryModalOpen(true);
    };

    const handleOpenSubcategoryConfig = (cat: TemporaryRentCategory, sub: TemporaryRentSubcategory) => {
        setSelectedCategory(cat);
        setSelectedSubcategory(sub);
        setIsSubcategoryConfigOpen(true);
    };

    const filteredCategories = categories.filter(c =>
        c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subcategories?.some(s => s.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || s.key.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-7xl mx-auto" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <Calendar className="w-7 h-7 text-emerald-600" />
                        مدیریت دسته‌بندی‌های اجاره موقت و اقامتگاه
                    </h1>
                    <p className="text-slate-500 mt-1 text-xs">
                        ساختار دسته‌بندی‌ها و اقامتگاه‌های روزانه، الگوهای قیمت‌گذاری و فیلدهای داینامیک
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPriceModelsModalOpen(true)}
                        className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm"
                    >
                        <Coins className="w-4 h-4 text-amber-600" />
                        مدل‌های قیمت‌گذاری اقامتگاه
                    </button>
                    <button
                        onClick={handleOpenCreateCategory}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-emerald-200"
                    >
                        <Plus className="w-4 h-4" />
                        دسته‌بندی اقامتگاه جدید
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="جستجو در دسته‌بندی‌ها و اقامتگاه‌ها..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
                    />
                </div>
            </div>

            {/* Categories List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-500 font-medium text-sm">در حال بارگذاری دسته‌بندی‌های اقامتگاه...</p>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <p className="text-slate-400 text-sm">هیچ دسته‌بندی اقامتگاهی یافت نشد</p>
                    </div>
                ) : (
                    filteredCategories.map((category) => (
                        <div
                            key={category.id}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-emerald-200"
                        >
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleExpand(category.id)}
                                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                                    >
                                        {expandedCategories.includes(category.id) ? (
                                            <ChevronDown className="w-5 h-5" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5" />
                                        )}
                                    </button>

                                    {category.icon ? (
                                        <img
                                            src={category.icon}
                                            alt=""
                                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 p-1 border border-slate-200"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 text-base">{category.displayName}</h3>
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono uppercase tracking-tighter">
                                                {category.key}
                                            </span>
                                            {category.isActive === false && (
                                                <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full">
                                                    غیرفعال
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                            <span>{category.subcategories?.length || 0} زیردسته اقامتگاهی</span>
                                            {category.description && (
                                                <span className="border-r pr-3 border-slate-200 line-clamp-1">
                                                    {category.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenCreateSubcategory(category)}
                                        className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-600 h-8 px-3 rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        افزودن زیردسته
                                    </button>
                                    <button
                                        onClick={() => handleOpenEditCategory(category)}
                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                        title="ویرایش دسته‌بندی"
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
                                        title="آرشیو دسته‌بندی"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Subcategories */}
                            {expandedCategories.includes(category.id) && (
                                <div className="bg-slate-50/50 border-t border-slate-100 p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {category.subcategories?.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic py-3 col-span-full text-center">
                                                زیردسته‌ای برای این اقامتگاه تعریف نشده است
                                            </p>
                                        ) : (
                                            category.subcategories.map((sub) => (
                                                <div
                                                    key={sub.id || sub.key}
                                                    className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-emerald-200 transition-all shadow-sm flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        {sub.icon ? (
                                                            <img
                                                                src={sub.icon}
                                                                alt=""
                                                                className="w-8 h-8 rounded-lg object-cover bg-slate-50 border border-slate-200"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                                                <Tag className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs font-bold text-slate-800">{sub.displayName}</span>
                                                                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">
                                                                    {sub.key}
                                                                </span>
                                                            </div>
                                                            {sub.description && (
                                                                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                                                    {sub.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleOpenSubcategoryConfig(category, sub)}
                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                            title="تنظیم مدل‌های قیمت و ویژگی‌ها"
                                                        >
                                                            <Sliders className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEditSubcategory(category, sub)}
                                                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                            title="ویرایش اطلاعات"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`آیا از آرشیو کردن زیردسته "${sub.displayName}" اطمینان دارید؟`)) {
                                                                    archiveSubcategoryMutation.mutate(sub.id);
                                                                }
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            title="آرشیو"
                                                        >
                                                            <Archive className="w-4 h-4" />
                                                        </button>
                                                    </div>
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
            {isCreateCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">ایجاد دسته‌بندی اقامتگاه جدید</h3>
                            <button onClick={() => setIsCreateCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">نام نمایشی (فارسی)</label>
                                <input
                                    type="text"
                                    placeholder="مثلاً: ویلا و سوئیت"
                                    value={categoryForm.displayName}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, displayName: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">کلید فنی (Key - انگلیسی و بدون فاصله)</label>
                                <input
                                    type="text"
                                    placeholder="مثلاً: villa_suite"
                                    value={categoryForm.key}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, key: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all uppercase"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">توضیحات</label>
                                <input
                                    type="text"
                                    placeholder="توضیح اختیاری..."
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">آیکون (URL)</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={categoryForm.icon}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">ترتیب نمایش</label>
                                    <input
                                        type="number"
                                        value={categoryForm.displayOrder}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex items-center gap-3">
                            <button
                                onClick={() => createCategoryMutation.mutate({
                                    key: categoryForm.key.trim().toLowerCase(),
                                    displayName: categoryForm.displayName.trim(),
                                    description: categoryForm.description || undefined,
                                    icon: categoryForm.icon || undefined,
                                    displayOrder: categoryForm.displayOrder
                                })}
                                disabled={!categoryForm.key || !categoryForm.displayName || createCategoryMutation.isPending}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 text-xs"
                            >
                                {createCategoryMutation.isPending ? "در حال ایجاد..." : "ایجاد دسته‌بندی"}
                            </button>
                            <button
                                onClick={() => setIsCreateCategoryModalOpen(false)}
                                className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all text-xs"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {isEditCategoryModalOpen && selectedCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">ویرایش دسته‌بندی اقامتگاه</h3>
                            <button onClick={() => setIsEditCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">کلید فنی (غیرقابل تغییر)</label>
                                <input
                                    type="text"
                                    value={selectedCategory.key}
                                    disabled
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-400 uppercase"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">نام نمایشی (فارسی)</label>
                                <input
                                    type="text"
                                    value={categoryForm.displayName}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, displayName: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">توضیحات</label>
                                <input
                                    type="text"
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">آیکون (URL)</label>
                                    <input
                                        type="text"
                                        value={categoryForm.icon}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">ترتیب نمایش</label>
                                    <input
                                        type="number"
                                        value={categoryForm.displayOrder}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                            </div>
                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={categoryForm.isActive}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                                        className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                                    />
                                    <span className="font-bold text-slate-700">دسته‌بندی فعال است</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex items-center gap-3">
                            <button
                                onClick={() => updateCategoryMutation.mutate({
                                    id: selectedCategory.id,
                                    payload: {
                                        displayName: categoryForm.displayName.trim(),
                                        description: categoryForm.description || undefined,
                                        icon: categoryForm.icon || undefined,
                                        displayOrder: categoryForm.displayOrder,
                                        isActive: categoryForm.isActive,
                                    }
                                })}
                                disabled={!categoryForm.displayName || updateCategoryMutation.isPending}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 text-xs"
                            >
                                {updateCategoryMutation.isPending ? "در حال بروزرسانی..." : "بروزرسانی تغییرات"}
                            </button>
                            <button
                                onClick={() => setIsEditCategoryModalOpen(false)}
                                className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all text-xs"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Subcategory Modal */}
            {isCreateSubcategoryModalOpen && selectedCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">
                                افزودن زیردسته به {selectedCategory.displayName}
                            </h3>
                            <button onClick={() => setIsCreateSubcategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">نام نمایشی (فارسی)</label>
                                <input
                                    type="text"
                                    placeholder="مثلاً: کلبه جنگلی"
                                    value={subcategoryForm.displayName}
                                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, displayName: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">کلید فنی زیردسته (Key - انگلیسی)</label>
                                <input
                                    type="text"
                                    placeholder="مثلاً: forest_cottage"
                                    value={subcategoryForm.key}
                                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, key: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono uppercase focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">توضیحات</label>
                                <input
                                    type="text"
                                    placeholder="توضیح اختیاری..."
                                    value={subcategoryForm.description}
                                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">آیکون (URL)</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={subcategoryForm.icon}
                                        onChange={(e) => setSubcategoryForm({ ...subcategoryForm, icon: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">ترتیب نمایش</label>
                                    <input
                                        type="number"
                                        value={subcategoryForm.displayOrder}
                                        onChange={(e) => setSubcategoryForm({ ...subcategoryForm, displayOrder: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex items-center gap-3">
                            <button
                                onClick={() => createSubcategoryMutation.mutate({
                                    categoryId: selectedCategory.id,
                                    payload: {
                                        key: subcategoryForm.key.trim().toLowerCase(),
                                        displayName: subcategoryForm.displayName.trim(),
                                        description: subcategoryForm.description || undefined,
                                        icon: subcategoryForm.icon || undefined,
                                        displayOrder: subcategoryForm.displayOrder
                                    }
                                })}
                                disabled={!subcategoryForm.key || !subcategoryForm.displayName || createSubcategoryMutation.isPending}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 text-xs"
                            >
                                {createSubcategoryMutation.isPending ? "در حال ایجاد..." : "اضافه کردن زیردسته"}
                            </button>
                            <button
                                onClick={() => setIsCreateSubcategoryModalOpen(false)}
                                className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all text-xs"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Subcategory Modal */}
            {isEditSubcategoryModalOpen && selectedSubcategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">ویرایش زیردسته اقامتگاه</h3>
                            <button onClick={() => setIsEditSubcategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">کلید فنی (غیرقابل تغییر)</label>
                                <input
                                    type="text"
                                    value={selectedSubcategory.key}
                                    disabled
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-400 uppercase"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">نام نمایشی (فارسی)</label>
                                <input
                                    type="text"
                                    value={subcategoryForm.displayName}
                                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, displayName: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">توضیحات</label>
                                <input
                                    type="text"
                                    value={subcategoryForm.description}
                                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">آیکون (URL)</label>
                                    <input
                                        type="text"
                                        value={subcategoryForm.icon}
                                        onChange={(e) => setSubcategoryForm({ ...subcategoryForm, icon: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">ترتیب نمایش</label>
                                    <input
                                        type="number"
                                        value={subcategoryForm.displayOrder}
                                        onChange={(e) => setSubcategoryForm({ ...subcategoryForm, displayOrder: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                            </div>
                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={subcategoryForm.isActive}
                                        onChange={(e) => setSubcategoryForm({ ...subcategoryForm, isActive: e.target.checked })}
                                        className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                                    />
                                    <span className="font-bold text-slate-700">زیردسته فعال است</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex items-center gap-3">
                            <button
                                onClick={() => updateSubcategoryMutation.mutate({
                                    subcategoryId: selectedSubcategory.id,
                                    payload: {
                                        displayName: subcategoryForm.displayName.trim(),
                                        description: subcategoryForm.description || undefined,
                                        icon: subcategoryForm.icon || undefined,
                                        displayOrder: subcategoryForm.displayOrder,
                                        isActive: subcategoryForm.isActive,
                                    }
                                })}
                                disabled={!subcategoryForm.displayName || updateSubcategoryMutation.isPending}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 text-xs"
                            >
                                {updateSubcategoryMutation.isPending ? "در حال بروزرسانی..." : "بروزرسانی تغییرات"}
                            </button>
                            <button
                                onClick={() => setIsEditSubcategoryModalOpen(false)}
                                className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all text-xs"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Subcategory Config Modal: Allowed Price Models & Dynamic Attributes */}
            {isSubcategoryConfigOpen && selectedSubcategory && selectedCategory && (
                <SubcategoryConfigModal
                    isOpen={isSubcategoryConfigOpen}
                    onClose={() => {
                        setIsSubcategoryConfigOpen(false);
                        setSelectedSubcategory(null);
                    }}
                    subcategoryId={selectedSubcategory.id}
                    subcategoryName={selectedSubcategory.displayName}
                    categoryName={selectedCategory.displayName}
                    variant="temporary-rent"
                />
            )}

            {/* Price Models Management Modal */}
            {isPriceModelsModalOpen && (
                <PriceModelsModal
                    isOpen={isPriceModelsModalOpen}
                    onClose={() => setIsPriceModelsModalOpen(false)}
                    variant="temporary-rent"
                />
            )}
        </div>
    );
}
