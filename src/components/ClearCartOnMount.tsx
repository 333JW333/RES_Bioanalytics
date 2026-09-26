"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

/** Empties the cart once a hosted checkout returns successfully. */
export default function ClearCartOnMount() {
  const { clearCart, isHydrated } = useCart();
  useEffect(() => {
    if (isHydrated) clearCart();
  }, [isHydrated, clearCart]);
  return null;
}
