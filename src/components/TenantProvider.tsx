"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PublicTenant } from "@/lib/tenant";

const TenantContext = createContext<PublicTenant | null>(null);

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: PublicTenant;
  children: ReactNode;
}) {
  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
}

export function useTenant(): PublicTenant {
  const tenant = useContext(TenantContext);
  if (!tenant) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return tenant;
}
