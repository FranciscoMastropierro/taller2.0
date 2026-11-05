"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { prepareSheet } from "./sheet-actions";

export function SheetForm({ orderId, version, kind }: { orderId: string; version: number; kind: "intake" | "work" }) {
  const [state, action, pending] = useActionState(prepareSheet, { error: "" });
  return <form action={action}><input type="hidden" name="orderId" value={orderId} /><input type="hidden" name="version" value={version} /><input type="hidden" name="kind" value={kind} /><Button variant="outline" disabled={pending}>{pending ? "Preparando…" : kind === "intake" ? "Ficha de ingreso" : "Ficha de trabajo"}</Button>{state.error && <p role="alert" className="mt-3 text-sm text-red-700">{state.error}</p>}</form>;
}
