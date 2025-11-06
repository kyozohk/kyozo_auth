"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import { GetUsersOutput, getUsersFlow } from "@/ai/flows/getUsersFlow";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ProtectedPage from "@/components/auth/protected-page";
import { LogOut, Loader2 } from "lucide-react";

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<GetUsersOutput>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleFetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    setUsers([]);
    try {
      const result = await getUsersFlow();
      setUsers(result);
    } catch (e: any) {
      setError(e.message || "An error occurred while fetching users.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <h1 className="text-xl font-semibold font-headline">Dashboard</h1>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back!</CardTitle>
              <CardDescription>You are successfully logged in.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Your email:{" "}
                <span className="font-medium text-primary">{user?.email}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Firestore Data</CardTitle>
              <CardDescription>
                Fetch user data from your Firestore database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleFetchUsers} disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Fetch Users
              </Button>
              {error && (
                <p className="mt-4 text-sm text-destructive">{error}</p>
              )}
              {users.length > 0 && (
                <div className="mt-4 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
    return (
        <ProtectedPage>
            <DashboardContent />
        </ProtectedPage>
    );
}
