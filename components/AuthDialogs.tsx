"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { translations, type Language } from "@/lib/translations";

interface AuthDialogsProps {
  showLoginDialog: boolean;
  showRegisterDialog: boolean;
  isLoading: boolean;
  loginEmail: string;
  loginPassword: string;
  registerEmail: string;
  registerPassword: string;
  registerConfirmPassword: string;
  language: Language;
  onLoginDialogChange: (open: boolean) => void;
  onRegisterDialogChange: (open: boolean) => void;
  onLoginEmailChange: (email: string) => void;
  onLoginPasswordChange: (password: string) => void;
  onRegisterEmailChange: (email: string) => void;
  onRegisterPasswordChange: (password: string) => void;
  onRegisterConfirmPasswordChange: (password: string) => void;
  onLogin: () => void;
  onSignUp: () => void;
}

export default function AuthDialogs({
  showLoginDialog,
  showRegisterDialog,
  isLoading,
  loginEmail,
  loginPassword,
  registerEmail,
  registerPassword,
  registerConfirmPassword,
  language,
  onLoginDialogChange,
  onRegisterDialogChange,
  onLoginEmailChange,
  onLoginPasswordChange,
  onRegisterEmailChange,
  onRegisterPasswordChange,
  onRegisterConfirmPasswordChange,
  onLogin,
  onSignUp,
}: AuthDialogsProps) {
  const t = translations[language];

  return (
    <>
      <Dialog open={showLoginDialog} onOpenChange={onLoginDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.signIn}</DialogTitle>
            <DialogDescription>
              {t.signIn} {t.withEmailAndPassword}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-light text-gray-600 dark:text-gray-400">
                {t.email}
              </label>
              <Input
                type="email"
                value={loginEmail}
                onChange={(e) => onLoginEmailChange(e.target.value)}
                placeholder={t.email}
                className="w-full"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-light text-gray-600 dark:text-gray-400">
                {t.password}
              </label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => onLoginPasswordChange(e.target.value)}
                placeholder={t.password}
                className="w-full"
                autoComplete="current-password"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onLogin();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              onClick={onLogin}
              className="w-full rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.signIn}...
                </>
              ) : (
                t.signIn
              )}
            </Button>
            <button
              type="button"
              onClick={() => {
                onLoginDialogChange(false);
                onRegisterDialogChange(true);
              }}
              className="text-xs font-light text-gray-500 dark:text-[#8B8C8D] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {t.dontHaveAccount} {t.signUp}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRegisterDialog} onOpenChange={onRegisterDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.signUp}</DialogTitle>
            <DialogDescription>
              {t.createNewAccount}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-light text-gray-600 dark:text-gray-400">
                {t.email}
              </label>
              <Input
                type="email"
                value={registerEmail}
                onChange={(e) => onRegisterEmailChange(e.target.value)}
                placeholder={t.email}
                className="w-full"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-light text-gray-600 dark:text-gray-400">
                {t.password}
              </label>
              <Input
                type="password"
                value={registerPassword}
                onChange={(e) => onRegisterPasswordChange(e.target.value)}
                placeholder={t.password}
                className="w-full"
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-light text-gray-600 dark:text-gray-400">
                {t.confirmPassword}
              </label>
              <Input
                type="password"
                value={registerConfirmPassword}
                onChange={(e) => onRegisterConfirmPasswordChange(e.target.value)}
                placeholder={t.confirmPassword}
                className="w-full"
                autoComplete="new-password"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSignUp();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              onClick={onSignUp}
              className="w-full rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.signUp}...
                </>
              ) : (
                t.signUp
              )}
            </Button>
            <button
              type="button"
              onClick={() => {
                onRegisterDialogChange(false);
                onLoginDialogChange(true);
              }}
              className="text-xs font-light text-gray-500 dark:text-[#8B8C8D] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {t.alreadyHaveAccount} {t.signIn}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

