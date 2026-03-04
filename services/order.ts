import { ApiResponse, Order, OrderStatus } from "@/lib/types";

export const getOrders = async (): Promise<Order[]> => {
  try {
    const res = await fetch("/api/order", {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) {
      console.error("Orders fetch failed:", res.status);
      return [];
    }
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
): Promise<boolean> => {
  const res = await fetch(`/api/order/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  return data.success;
};

export const updateOrderItemStatus = async (
  orderItemId: string,
  status: OrderStatus,
): Promise<boolean> => {
  const res = await fetch(`/api/order/item/${orderItemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  return data.success;
};

export const createOrder = async (orderData: any): Promise<boolean> => {
  const res = await fetch("/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  const data = await res.json();
  return res.ok || data.success;
};

export const updateOrderItems = async (
  orderId: string,
  items: any[],
  staffId?: string,
): Promise<boolean> => {
  const res = await fetch(`/api/order/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, staffId }),
  });
  const data = await res.json();
  return data.success;
};

export const deleteOrderItem = async (
  orderItemId: string,
): Promise<ApiResponse> => {
  try {
    const res = await fetch(`/api/order/item/${orderItemId}`, {
      method: "DELETE",
    });

    const result = await res.json();

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Internal Server Error",
    };
  }
};

export const getOrderHistory = async (page = 1, limit = 20, search = "") => {
  try {
    const res = await fetch(
      `/api/order/history?page=${page}&limit=${limit}&search=${search}`,
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("History Fetch Error:", error);
    return { success: false, data: [] };
  }
};
