import { PropsWithChildren, useEffect } from "react";

import { useAuthStore } from "@/store/auth-store";

export function AuthBootstrap({ children }: PropsWithChildren) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return children;
}
