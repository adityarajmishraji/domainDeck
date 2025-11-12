import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function ErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 transition-all">
      <Card className="w-full max-w-md shadow-lg bg-white dark:bg-slate-800 rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
            Oops! Something Went Wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-slate-700 dark:text-slate-300">
            The page you're looking for doesn't exist or an error occurred.
          </p>
          <Button
            asChild
            className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 transition-all hover:scale-105"
          >
            <Link to="/app/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorPage;
