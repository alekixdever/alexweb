"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import MainContent from "@/components/MainContent";
import RightSidebar from "@/components/RightSidebar";
import AuthModal from "@/components/AuthModal";
import MobileDrawer from "@/components/MobileDrawer";
import DMDrawer from "@/components/DMDrawer";

export default function Home() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { setLeftDrawer } = useApp();
  const [dmOpen, setDmOpen] = useState(false);
  const [dmContactId, setDmContactId] = useState<string | null>(null);

  function openDM(contactId: string) {
    setDmContactId(contactId);
    setDmOpen(true);
  }

  const handleLocationSelect = (id: string) => {
    setSelectedLocation(id);
    setLeftDrawer(false);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setLeftDrawer(false);
  };

  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id);
    setLeftDrawer(false);
  };

  return (
    <div style={{ position: "relative", minHeight: "100svh" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: "var(--bg-base)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100svh",
        }}
      >
        <Header />

        <div
          style={{
            display: "flex",
            flex: 1,
            gap: "var(--gap)",
            padding: "var(--gap)",
            minHeight: 0,
          }}
        >
          {/* Desktop Left Sidebar */}
          <div className="hidden lg:block" style={{ flexShrink: 0 }}>
            <LeftSidebar
              selectedLocation={selectedLocation}
              selectedDate={selectedDate}
              selectedCategory={selectedCategory}
              onLocationSelect={setSelectedLocation}
              onDateSelect={setSelectedDate}
              onCategorySelect={setSelectedCategory}
            />
          </div>

          <MainContent
            selectedLocation={selectedLocation}
            selectedDate={selectedDate}
            selectedCategory={selectedCategory}
          />

          <div className="hidden lg:block" style={{ flexShrink: 0 }}>
            <RightSidebar onOpenDM={openDM} />
          </div>
        </div>
      </div>

      {/* Mobile Drawers */}
      <MobileDrawer side="left">
        <LeftSidebar
          selectedLocation={selectedLocation}
          selectedDate={selectedDate}
          selectedCategory={selectedCategory}
          onLocationSelect={handleLocationSelect}
          onDateSelect={handleDateSelect}
          onCategorySelect={handleCategorySelect}
        />
      </MobileDrawer>

      <MobileDrawer side="right">
        <RightSidebar onOpenDM={openDM} />
      </MobileDrawer>

      <AuthModal />

      {/* DM Drawer — top level, not inside MobileDrawer */}
      <DMDrawer
        open={dmOpen}
        onClose={() => { setDmOpen(false); setDmContactId(null); }}
        initialContactId={dmContactId}
      />
    </div>
  );
}
