import React from "react";
import "@/App.css";
import { AppProvider, useApp } from "./context/AppContext";
import ServerSelect from "./components/ServerSelect";
import Login from "./components/Login";
import MainApp from "./components/MainApp";

const AppContent = () => {
  const { currentServer, currentUser, isLoading, initServer } = useApp();

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-screen" data-testid="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  // No server selected - show server selection
  if (!currentServer) {
    return <ServerSelect />;
  }

  // Server selected but no user - show login
  if (!currentUser) {
    return <Login onBack={() => initServer(null)} />;
  }

  // User logged in - show main app
  return <MainApp />;
};

function App() {
  return (
    <AppProvider>
      <div className="App" data-testid="app-root">
        <AppContent />
      </div>
    </AppProvider>
  );
}

export default App;
