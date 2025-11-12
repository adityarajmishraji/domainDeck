import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Home,
  Users,
  Folder,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axiosInstance from "@/utils/axios";
import { toast } from "react-toastify";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/users/logout");
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const navigationItems = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/customers", icon: Users, label: "Customers" },
    { to: "/projects", icon: Folder, label: "Projects" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <div
        className={`lg:hidden fixed top-6 z-50 transition-all duration-300 ${
          isMobileMenuOpen ? "left-[270px]" : "left-4"
        }`}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 dark:bg-gradient-to-r dark:from-blue-600 dark:to-blue-700 border-2 border-blue-500 dark:border-blue-600 rounded-full shadow-lg hover:shadow-xl shadow-blue-500/70 dark:shadow-blue-600/70 text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200"
        >
          {isMobileMenuOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar Container */}
      <div
        className={`${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static top-0 left-0 h-screen ${
          isOpen ? "w-72" : "w-20"
        } bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out flex flex-col z-40 shadow-xl lg:shadow-none`}
      >
        {/* Header Section */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 relative">
          <div className="flex items-center">
            {isOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                    Domain Deck
                  </h1>
                </div>
              </div>
            )}
            {!isOpen && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-sm">A</span>
              </div>
            )}
          </div>

          {/* Toggle Button - Hidden on mobile */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex absolute -right-4 top-16 w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 dark:bg-gradient-to-r dark:from-blue-600 dark:to-blue-700 border-2 border-blue-500 dark:border-blue-600 rounded-full shadow-lg hover:shadow-xl shadow-blue-500/70 dark:shadow-blue-600/70 text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200 z-30"
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    }`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <IconComponent
                    className={`h-5 w-5 transition-all duration-200 ${
                      isOpen ? "mr-3" : "mx-auto"
                    }`}
                  />
                  {isOpen && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                  {!isOpen && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45"></div>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleLogout}
            className="group w-full flex items-center px-3 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          >
            <LogOut
              className={`h-5 w-5 transition-all duration-200 ${
                isOpen ? "mr-3" : "mx-auto"
              }`}
            />
            {isOpen && <span className="font-medium text-sm">Logout</span>}
            {!isOpen && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                Logout
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45"></div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={toggleMobileMenu}
        />
      )}
    </>
  );
}

export default Sidebar;
