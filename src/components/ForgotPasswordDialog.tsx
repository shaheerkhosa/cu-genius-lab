import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Loader2, Mail, KeyRound, ShieldCheck } from "lucide-react";
import { z } from "zod";

type Step = "email" | "code" | "password";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  defaultEmail = "",
}: ForgotPasswordDialogProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep("email");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setSubmitting(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const sendCode = async () => {
    const trimmed = email.trim();
    const parsed = z.string().email().safeParse(trimmed);
    if (!parsed.success) {
      toast.error("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Code sent to ${trimmed}.`);
      setStep("code");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "recovery",
      });
      if (error) {
        toast.error(error.message || "That code didn't match.");
        return;
      }
      // verifyOtp opens a recovery session — updateUser({ password }) will now succeed.
      setStep("password");
    } finally {
      setSubmitting(false);
    }
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated. You're signed in.");
      handleClose(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "email" && <Mail className="h-4 w-4" />}
            {step === "code" && <ShieldCheck className="h-4 w-4" />}
            {step === "password" && <KeyRound className="h-4 w-4" />}
            {step === "email" && "Reset password"}
            {step === "code" && "Enter verification code"}
            {step === "password" && "Choose a new password"}
          </DialogTitle>
          <DialogDescription>
            {step === "email" && "We'll email you a 6-digit code."}
            {step === "code" && `Enter the 6-digit code sent to ${email}.`}
            {step === "password" && "Pick a strong password (min. 6 characters)."}
          </DialogDescription>
        </DialogHeader>

        {step === "email" && (
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              placeholder="you@example.com"
              autoFocus
            />
          </div>
        )}

        {step === "code" && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                disabled={submitting}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="text-center text-xs text-muted-foreground">
              Didn't get it?{" "}
              <button
                type="button"
                onClick={sendCode}
                disabled={submitting}
                className="text-primary hover:underline"
              >
                Resend code
              </button>
            </div>
          </div>
        )}

        {step === "password" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitting}
                autoComplete="new-password"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                autoComplete="new-password"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-row sm:justify-between gap-2">
          {step !== "email" ? (
            <Button
              type="button"
              variant="ghost"
              disabled={submitting}
              onClick={() => setStep(step === "password" ? "code" : "email")}
            >
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            disabled={submitting}
            onClick={() => {
              if (step === "email") sendCode();
              else if (step === "code") verifyCode();
              else submitNewPassword();
            }}
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {step === "email" && "Send code"}
            {step === "code" && "Verify"}
            {step === "password" && "Update password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
