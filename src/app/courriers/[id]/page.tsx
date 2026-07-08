"use client";

import { useParams } from "next/navigation";
import ClientPage from "./ClientPage";

export default function Page() {
  const params = useParams<{ id: string }>();
  return <ClientPage id={params?.id as string} />;
}
