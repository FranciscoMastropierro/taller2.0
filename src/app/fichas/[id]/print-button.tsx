"use client";
import { Button } from "@/components/ui/button";
export function PrintButton({ label = "Imprimir ficha" }: { label?: string }) {
  return <Button onClick={() => window.print()}>{label}</Button>;
}
