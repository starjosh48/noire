import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "~/auth/auth-provider";
import type { Database } from "~/shared";
import { apiFetch } from "./client";

// Shapes returned by the website's API, derived from the shared database types so they can't
// drift (the website's own query modules are server-only, so they aren't imported directly).

type Tables = Database["public"]["Tables"];
type OrderRow = Tables["noire_orders"]["Row"];
type OrderItemRow = Tables["noire_order_items"]["Row"];

export type Profile = Pick<Tables["noire_profiles"]["Row"], "id" | "email" | "full_name" | "avatar_url" | "phone" | "created_at">;

export type OrderListItem = Pick<OrderRow, "id" | "order_number" | "status" | "total" | "currency" | "created_at"> & {
  items: Pick<OrderItemRow, "product_name" | "product_number" | "image_url" | "size_ml" | "quantity">[];
};

export type OrderDetail = Omit<OrderRow, "idempotency_key" | "cart_id" | "payment_reference"> & {
  items: Pick<
    OrderItemRow,
    "id" | "product_name" | "product_number" | "product_slug" | "image_url" | "size_ml" | "quantity" | "unit_price" | "total_price"
  >[];
};

export function useProfile() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["me", "profile"],
    queryFn: async () => (await apiFetch<{ profile: Profile | null }>("/profile")).profile,
    enabled: !!userId,
  });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { fullName: string; phone: string }) =>
      apiFetch<{ status: string; message?: string; profile?: Profile }>("/profile", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: (result) => {
      if (result.profile) queryClient.setQueryData(["me", "profile"], result.profile);
    },
  });
}

export function useOrders() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["me", "orders"],
    queryFn: async () => (await apiFetch<{ orders: OrderListItem[] }>("/orders")).orders,
    enabled: !!userId,
  });
}

/** An order for its signed-in owner, or for anyone holding its access key (guest checkout). */
export function useOrder(orderNumber: string, accessKey?: string) {
  return useQuery({
    queryKey: ["me", "order", orderNumber, accessKey ?? null],
    queryFn: async () =>
      (await apiFetch<{ order: OrderDetail }>(`/orders/${encodeURIComponent(orderNumber)}${accessKey ? `?key=${encodeURIComponent(accessKey)}` : ""}`))
        .order,
  });
}
