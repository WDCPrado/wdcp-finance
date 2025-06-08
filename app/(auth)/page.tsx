"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Button onClick={() => router.push("/dashboard")}>Dashboard</Button>
    </div>
  );
}
