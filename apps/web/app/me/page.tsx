import type { Metadata } from "next";
import { EccoCustomizer } from "@/components/EccoCustomizer";
import { EccoInsights } from "@/components/EccoInsights";

export const metadata: Metadata = { title: "Your Ecco" };

export default function MePage() {
  return (
    <div className="space-y-5">
      <EccoCustomizer />
      <div className="mx-auto max-w-2xl">
        <EccoInsights />
      </div>
    </div>
  );
}
