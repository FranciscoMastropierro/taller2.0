"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-lg px-6 py-24"><h1 className="text-2xl font-semibold">No pudimos abrir el taller.</h1><p className="my-5 text-neutral-600">Revisá la conexión o intentá nuevamente. Si el problema continúa, contactá a quien administra el sistema.</p><Button onClick={reset}>Reintentar</Button></main>;
}
