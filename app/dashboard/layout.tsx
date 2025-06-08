import Container from "@/components/conteiner";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container>
      <div className="min-h-screen w-full">{children}</div>
      <Toaster position="bottom-right" richColors expand={false} />
    </Container>
  );
}
