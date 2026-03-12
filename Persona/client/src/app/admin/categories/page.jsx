"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import {
  getCategories,
  createCategory,
  deleteCategory,
  toggleCategoryStatus,
  getSubcategories,
  createSubcategory,
  deleteSubcategory,
  toggleSubcategoryStatus
} from "@/services/category.service";

export default function CategoriesPage() {
  const [categories, setCategories] = null || useState([]);
  const [subcategories, setSubcategories] = null || useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);

  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "" });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: "", slug: "", category: "" });

  const fetchData = async () => {
    try {
      const catRes = await getCategories();
      const subRes = await getSubcategories();
      console.log("CatRes", catRes);
      if (catRes) setCategories(catRes);
      if (subRes) setSubcategories(subRes);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateSlug = (text) => {
    return text.toLowerCase().trim().replace(/[\s\W-]+/g, "-");
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await createCategory(categoryForm);
      setIsCategoryModalOpen(false);
      setCategoryForm({ name: "", slug: "" });
      fetchData();
    } catch (error) {
      alert("Error creating category");
    }
  };

  const handleSubcategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await createSubcategory(subcategoryForm);
      setIsSubcategoryModalOpen(false);
      setSubcategoryForm({ name: "", slug: "", category: "" });
      fetchData();
    } catch (error) {
      alert("Error creating subcategory");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Are you sure? This will delete all its subcategories too.")) return;
    try {
      await deleteCategory(id);
      fetchData();
    } catch (error) {
      alert("Error deleting category");
    }
  };

  const handleDeleteSubcategory = async (id) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;
    try {
      await deleteSubcategory(id);
      fetchData();
    } catch (error) {
      alert("Error deleting subcategory");
    }
  };

  const handleToggleCategoryStatus = async (id) => {
    try {
      await toggleCategoryStatus(id);
      fetchData();
    } catch (error) {
      alert("Error toggling category status");
    }
  };

  const handleToggleSubcategoryStatus = async (id) => {
    try {
      await toggleSubcategoryStatus(id);
      fetchData();
    } catch (error) {
      alert("Error toggling subcategory status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categories & Subcategories</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            <Plus size={18} /> New Category
          </button>
          <button
            onClick={() => setIsSubcategoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus size={18} /> New Subcategory
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Categories</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="pb-3">Name</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-medium">
                    {cat.name}
                    <div className="text-xs text-gray-500 font-normal">{cat.slug}</div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${cat.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {cat.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      onClick={() => handleToggleCategoryStatus(cat._id)}
                      className={`${cat.isActive !== false ? 'text-gray-500 hover:text-gray-700' : 'text-green-500 hover:text-green-700'}`}
                      title={cat.isActive !== false ? "Disable" : "Enable"}
                    >
                      {cat.isActive !== false ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat._id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Subcategories</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="pb-3">Name</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((sub) => (
                <tr key={sub._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-medium">
                    {sub.name}
                    <div className="text-xs text-gray-500 font-normal">{sub.category?.name || 'N/A'}</div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${sub.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {sub.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      onClick={() => handleToggleSubcategoryStatus(sub._id)}
                      className={`${sub.isActive !== false ? 'text-gray-500 hover:text-gray-700' : 'text-green-500 hover:text-green-700'}`}
                      title={sub.isActive !== false ? "Disable" : "Enable"}
                    >
                      {sub.isActive !== false ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => handleDeleteSubcategory(sub._id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Category</h2>
            <form onSubmit={handleCategorySubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ name: e.target.value, slug: generateSlug(e.target.value) })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: generateSlug(e.target.value) })}
                    className="w-full p-2 border rounded bg-gray-50"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSubcategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Subcategory</h2>
            <form onSubmit={handleSubcategorySubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    required
                    value={subcategoryForm.category}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, category: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Category...</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={subcategoryForm.name}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value, slug: generateSlug(e.target.value) })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    required
                    value={subcategoryForm.slug}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, slug: generateSlug(e.target.value) })}
                    className="w-full p-2 border rounded bg-gray-50"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsSubcategoryModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
