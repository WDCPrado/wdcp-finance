import { UserMenu } from "@/components/auth/user-menu";
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
      <Toaster position="bottom-center" richColors expand={false} />
      <div className="fixed bottom-4 left-4 z-50">
        <UserMenu />
      </div>
    </Container>
  );
}
