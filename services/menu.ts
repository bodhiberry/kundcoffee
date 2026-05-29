import {
  Category,
  Dish,
  SubMenu,
  AddOn,
  MenuSet,
  ComboOffer,
  Stock,
  ApiResponse,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function getStocks(): Promise<Stock[]> {
  try {
    const res = await fetch("/api/stocks", { cache: "no-store" });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Failed to fetch stocks:", error);
    return [];
  }
}

// --- Categories ---

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch("/api/category", { cache: "no-store" });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function addCategory(data: Partial<Category>) {
  try {
    const res = await fetch("/api/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to add category:", error);
    return { success: false, message: "Network error" };
  }
}
export async function updateCategory(data: Partial<Category> & { sortOrder?: number }) {
  if (!data.id) {
    return { success: false, message: "ID required" };
  }

  try {
    const res = await fetch(`/api/category/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        image: data.image,
        sortOrder: data.sortOrder, // <--- ADD THIS LINE
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Update category failed:", errorData);
      return { success: false, message: errorData.message || "Update failed" };
    }

    return await res.json();
  } catch (error) {
    console.error("Failed to update category:", error);
    return { success: false, message: "Network error" };
  }
}

export async function deleteCategory(id: string) {
  try {
    const res = await fetch(`/api/category?id=${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, message: "Network error" };
  }
}

// --- Dishes ---

export async function getDishes(): Promise<Dish[]> {
  try {
    const res = await fetch("/api/dishes", { cache: "no-store" });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Failed to fetch dishes:", error);
    return [];
  }
}

export async function addDish(data: Partial<Dish>):Promise<ApiResponse<Dish>> {
  try {
    const res = await fetch("/api/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const dish:ApiResponse<Dish> = await res.json();
    return dish
  } catch (error) {
    console.error("Failed to add dish:", error);
    return { success: false, message: "Network error" };
  }
}

export async function updateDish(data: Partial<Dish>):Promise<ApiResponse<Dish>> {
  if (!data.id) return { success: false, message: "ID required" };
  try {
    const res = await fetch(`/api/dishes/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updatedDish:ApiResponse<Dish> = await res.json();
    return updatedDish  
  } catch (error) {
    console.error("Failed to update dish:", error);
    return { success: false, message: "Network error" };
  }
}

export async function deleteDish(id: string) {
  try {
    const res = await fetch(`/api/dishes?id=${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to delete dish:", error);
    return { success: false, message: "Network error" };
  }
}

export async function duplicateDish(id: string): Promise<ApiResponse<Dish>> {
  try {
    const res = await fetch(`/api/dishes/${id}/duplicate`, {
      method: "POST",
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to duplicate dish:", error);
    return { success: false, message: "Network error" };
  }
}

// --- Sub Menus ---

export async function getSubMenus(): Promise<SubMenu[]> {
  try {
    const res = await fetch("/api/sub-menu", { cache: "no-store" });
    const data = await res.json();
    console.log("submenu", data);
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Failed to fetch sub menus:", error);
    return [];
  }
}

export async function addSubMenu(data: Partial<SubMenu> & { sortOrder?: number }) {
  try {
    const res = await fetch("/api/sub-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    // 3. Return the full JSON response so the UI can check res.success
    return await res.json();
  } catch (error) {
    console.error("Failed to add sub menu:", error);
    return { success: false, message: "Network error" };
  }
}

export async function updateSubMenu(data: Partial<SubMenu> & { sortOrder?: number }) {
  if (!data.id) return { success: false, message: "ID required" };
  try {
    const res = await fetch(`/api/sub-menu/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), 
    });

    return await res.json(); 
  } catch (error) {
    console.error("Failed to update sub menu:", error);
    return { success: false, message: "Network error" };
  }
}

export async function deleteSubMenu(id: string) {
  try {
    const res = await fetch(`/api/sub-menu/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to delete sub menu:", error);
    return { success: false, message: "Network error" };
  }
}

// --- Add Ons ---

export async function getAddOns(): Promise<AddOn[]> {
  try {
    const res = await fetch("/api/addons", { cache: "no-store" });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Failed to fetch addons:", error);
    return [];
  }
}

export async function addAddOn(data: any) { 
  try {
    const res = await fetch("/api/addons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: "Network error" };
  }
}

export async function updateAddOn(data: any) {
  if (!data.id) return { success: false, message: "ID required" };
  const { id, ...updates } = data;
  try {
    const res = await fetch(`/api/addons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: "Network error" };
  }
}

export async function deleteAddOn(id: string) {
  try {
    const res = await fetch(`/api/addons/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to delete addon:", error);
    return { success: false, message: "Network error" };
  }
}

// --- Menu Sets ---

export async function getMenuSets(): Promise<MenuSet[]> {
  try {
    const res = await fetch("/api/menu-sets", { cache: "no-store" });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Failed to fetch menu sets:", error);
    return [];
  }
}

export async function addMenuSet(data: Partial<MenuSet>) {
  try {
    const res = await fetch("/api/menu-sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to add menu set:", error);
    return { success: false, message: "Network error" };
  }
}

export async function updateMenuSet(data: Partial<MenuSet>) {
  if (!data.id) return { success: false, message: "ID required" };
  try {
    const res = await fetch("/api/menu-sets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to update menu set:", error);
    return { success: false, message: "Network error" };
  }
}

export async function deleteMenuSet(id: string) {
  try {
    const res = await fetch(`/api/menu-sets?id=${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to delete menu set:", error);
    return { success: false, message: "Network error" };
  }
}

// --- Combo Offers ---

export async function getCombos(): Promise<ComboOffer[]> {
  try {
    const res = await fetch("/api/combos", { cache: "no-store" });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Failed to fetch combos:", error);
    return [];
  }
}


export async function addCombo(
  data: Partial<ComboOffer>
): Promise<ApiResponse<ComboOffer>> {
  try {
    const res = await fetch("/api/combos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return await res.json();
  } catch (error) {
    console.error("Failed to add combo:", error);
    return { success: false, message: "Network error" };
  }
}

/**
 * Updates an existing combo.
 */
export async function updateCombo(
  data: Partial<ComboOffer>
): Promise<ApiResponse<ComboOffer>> {
  const { id, ...updates } = data;
  if (!id) return { success: false, message: "ID required" };

  try {
    const res = await fetch(`/api/combos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates), // This includes items, price, etc.
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: "Network error" };
  }
}

export async function deleteCombo(id: string): Promise<ApiResponse<null>> {
  try {
    // Calling /api/combos/123 with DELETE method
    const res = await fetch(`/api/combos/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: "Network error" };
  }
}