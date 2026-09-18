"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Middleware only checks auth on navigation, so a session that ends while a
 * page is open (expired or failed token refresh) would otherwise leave the
 * app blank. Rendered under <Unauthenticated>, this sends the person to sign in.
 */
export function RedirectToSignIn() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/signin");
  }, [router]);
  return null;
}
