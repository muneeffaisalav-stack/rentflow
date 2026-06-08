'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const syncUserProfile = async (user: any, name: string) => {
    if (!db || !user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      const isAdminEmail = user.email?.toLowerCase() === 'admin@rentflow.com';
      const targetRole = isAdminEmail ? 'super-admin' : 'landlord';

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          id: user.uid,
          name: name || user.displayName || 'User',
          email: user.email,
          role: targetRole,
          createdAt: new Date().toISOString()
        });
      } else {
        const currentData = userDoc.data();
        if (isAdminEmail && currentData.role !== 'super-admin') {
          await updateDoc(userRef, { role: 'super-admin' });
        }
      }
    } catch (err) {
      console.error('Initial profile sync failed:', err);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>, type: 'login' | 'signup') => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).trim();
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
      if (type === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await syncUserProfile(userCredential.user, name);
        toast({ title: 'Account Created', description: 'Welcome to RentFlow!' });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await syncUserProfile(userCredential.user, userCredential.user.displayName || '');
        toast({ title: 'Signed In', description: 'Welcome back!' });
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await syncUserProfile(result.user, result.user.displayName || '');
      toast({ title: 'Signed In', description: 'Welcome to RentFlow!' });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg">
            <Building2 className="size-8" />
          </div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">RentFlow</h1>
          <p className="text-muted-foreground font-medium tracking-tight uppercase text-xs">Modern Property Management</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-border/60 shadow-xl overflow-hidden">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-0 bg-slate-50/50 border-b">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <TabsContent value="login">
              <form onSubmit={(e) => handleEmailAuth(e, 'login')}>
                <CardHeader>
                  <CardTitle className="font-headline">Welcome Back</CardTitle>
                  <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="name@example.com" required className="bg-slate-50/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required className="bg-slate-50/50" />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full font-bold h-11" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={(e) => handleEmailAuth(e, 'signup')}>
                <CardHeader>
                  <CardTitle className="font-headline">Create Account</CardTitle>
                  <CardDescription>Start managing your properties efficiently today.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input id="signup-name" name="name" placeholder="John Doe" required className="bg-slate-50/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" name="email" type="email" placeholder="name@example.com" required className="bg-slate-50/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" name="password" type="password" required className="bg-slate-50/50" />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full font-bold h-11" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative px-6 pb-6 mt-4">
            <div className="absolute inset-0 flex items-center px-6">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-semibold">Or continue with</span>
            </div>
          </div>

          <CardFooter className="pt-0">
            <Button variant="outline" className="w-full h-11 border-border/60 hover:bg-slate-50" onClick={handleGoogleSignIn} disabled={isLoading}>
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Google Account
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
