import Container from "@/components/conteiner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container>
      <div className="min-h-screen w-full">{children}</div>
    </Container>
  );
}
