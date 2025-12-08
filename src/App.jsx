import Navbar from "./components/Shared/Navbar";
import Hero from "./components/Landing/Hero";
import Features from "./components/Landing/Features";
import AuthScreen from "./components/Auth/AuthScreen";
import Dashboard from "./components/Dashboard/Dashboard";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function Landing() {
  return (
    <div className="min-h-screen bg-black selection:bg-pink-500/30">
      <Navbar />
      <main>
        <Hero />
        <Features />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
