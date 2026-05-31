"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import MainContent from "@/components/MainContent";
import RightSidebar from "@/components/RightSidebar";
import AuthModal from "@/components/AuthModal";
import MobileDrawer from "@/components/MobileDrawer";

export default function Home() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedLocation, setSelectedLocation] = useState("kyoto-station");
  const { setLeftDrawer } = useApp();

  const handleLocationSelect = (id: string) => {
    setSelectedLocation(id);
    setLeftDrawer(false);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setLeftDrawer(false);
  };

  return (
    <div style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
      {/* Background sits behind everything */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: "var(--bg-base)",
        }}
      />

      {/* Layout */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        <Header />

        <div
          style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
            gap: "var(--gap)",
            padding: "var(--gap)",
          }}
        >
          {/* Desktop Left Sidebar */}
          <div className="hidden lg:block" style={{ flexShrink: 0 }}>
            <LeftSidebar
              selectedLocation={selectedLocation}
              selectedDate={selectedDate}
              onLocationSelect={setSelectedLocation}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* Main Content */}
          <MainContent
            selectedLocation={selectedLocation}
            selectedDate={selectedDate}
          />

          {/* Desktop Right Sidebar */}
          <div className="hidden lg:block" style={{ flexShrink: 0 }}>
            <RightSidebar />
          </div>
        </div>
      </div>

      {/* Mobile Drawers */}
      <MobileDrawer side="left">
        <LeftSidebar
          selectedLocation={selectedLocation}
          selectedDate={selectedDate}
          onLocationSelect={handleLocationSelect}
          onDateSelect={handleDateSelect}
        />
      </MobileDrawer>

      <MobileDrawer side="right">
        <RightSidebar />
      </MobileDrawer>

      <AuthModal />
    </div>
  );
}
