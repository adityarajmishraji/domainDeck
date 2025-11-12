import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, LogOut, Settings, User } from "lucide-react";
import axiosInstance from "@/utils/axios";
import { toast } from "react-toastify";
function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get("/users/me");
        setUser(response.data.data);
      } catch (error) {
        toast.error("Failed to fetch user profile");
      }
    };
    fetchUser();

    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/users/logout");
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Greeting */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {getGreeting()}, {user?.fullname?.split(" ")[0] || "Admin"}! 👋
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="sm:hidden">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Dashboard
              </h2>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-slate-200 dark:hover:ring-slate-700 transition-all duration-200"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar} alt="User Avatar" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold">
                      {user?.fullname?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 p-2"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar} alt="User Avatar" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold">
                          {user?.fullname?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {user?.fullname || "Admin User"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {user?.email || "admin@example.com"}
                        </p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <NavLink to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Preferences</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
export default Header;
