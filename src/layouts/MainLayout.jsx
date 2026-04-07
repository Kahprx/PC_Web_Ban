import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SupportChatWidget from "../components/SupportChatWidget";

export default function MainLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
      <SupportChatWidget />
    </>
  );
}
