import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RuoGateModal from "@/components/RuoGateModal";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RuoGateModal />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
