"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConsultationRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/consultation/dossiers");
  }, [router]);
  return null;
}
