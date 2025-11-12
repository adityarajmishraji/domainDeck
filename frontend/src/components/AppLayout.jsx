import { Outlet, useNavigation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

function AppLayout() {
  const navigation = useNavigation();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {navigation.state === "loading" ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  {/* Enhanced Loading Spinner */}
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                      Loading...
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Please wait while we fetch your data
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 lg:p-8">
                {/* Content Wrapper with subtle styling */}
                <div className="min-h-full">
                  <Outlet />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
