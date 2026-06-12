import type { Metadata } from "next";
import { EccoCustomizer } from "@/components/EccoCustomizer";

export const metadata: Metadata = { title: "Your Ecco" };

export default function MePage() {
  return <EccoCustomizer />;
}
