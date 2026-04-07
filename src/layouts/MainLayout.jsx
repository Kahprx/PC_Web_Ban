import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SupportChatWidget from "../components/SupportChatWidget";
import { applyRevealMotion } from "../utils/revealMotion";

export default function MainLayout() {
  const location = useLocation();
  const routeKey = `${location.pathname}${location.search}`;

  useEffect(() => {
    let cleanupReveal = () => {};
    const rafId = window.requestAnimationFrame(() => {
      cleanupReveal = applyRevealMotion(document);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      cleanupReveal();
    };
  }, [location.pathname, location.search]);

  return (
    <>
      <Header />
      <div className="motion-route-shell">
        <div className="motion-route-view" key={routeKey}>
          <Outlet />
        </div>
      </div>
      <Footer />
      <SupportChatWidget />
    </>
  );
}
