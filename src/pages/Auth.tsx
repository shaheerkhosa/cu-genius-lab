import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { PillToggle } from "@/components/PillToggle";
import { z } from "zod";
import { usePortalTheme } from "@/hooks/usePortalTheme";

const signupSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const portalOptions = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [portal, setPortal] = useState("student");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string })?.from || (portal === "teacher" ? "/teacher" : "/");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check role to redirect appropriately
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.role === 'teacher') {
              navigate("/teacher");
            } else {
              navigate("/");
            }
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.role === 'teacher') {
              navigate("/teacher");
            } else {
              navigate("/");
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = signupSchema.parse({ username, email, password });

      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            username: validatedData.username,
            portal_type: portal,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please login instead.");
        } else {
          toast.error(error.message);
        }
      } else if (data.user) {
        // Assign role based on portal selection
        const role = portal === "teacher" ? "teacher" : "user";
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: role,
        });
        toast.success("Account created successfully! You can now login.");
        setIsLogin(true);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An error occurred during signup");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = loginSchema.parse({ email, password });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please try again.");
        } else {
          toast.error(error.message);
        }
      } else if (data.user) {
        toast.success("Logged in successfully!");
        // Redirect handled by onAuthStateChange
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An error occurred during login");
      }
    } finally {
      setLoading(false);
    }
  };

  const isTeacher = portal === "teacher";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative ${isTeacher ? "teacher-portal" : ""}`}>
      <DecorativeBackground />

      <Card className="w-full max-w-md relative z-10 border-2">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-3xl font-bold text-primary">CUIntelligence</CardTitle>

          {/* Portal pill toggle */}
          <div className="flex justify-center">
            <PillToggle value={portal} onChange={setPortal} options={portalOptions} />
          </div>

          <CardDescription>
            {isLogin
              ? `Welcome back! Login to the ${isTeacher ? "Teacher" : "Student"} portal`
              : `Create your ${isTeacher ? "Teacher" : "Student"} account`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  className="rounded-xl"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl"
              disabled={loading}
            >
              {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
              disabled={loading}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
