"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Lock, Eye, EyeOff, User } from "lucide-react";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
  newPassword: z.string().min(6, "新しいパスワードは6文字以上で入力してください"),
  confirmPassword: z.string().min(1, "確認パスワードを入力してください"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
});

const usernameChangeSchema = z.object({
  newUsername: z.string().min(3, "ユーザー名は3文字以上で入力してください").max(50, "ユーザー名は50文字以下で入力してください"),
  currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
});

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
type UsernameChangeFormData = z.infer<typeof usernameChangeSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, logout, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showUsernamePassword, setShowUsernamePassword] = useState(false);

  const passwordForm = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const usernameForm = useForm<UsernameChangeFormData>({
    resolver: zodResolver(usernameChangeSchema),
    defaultValues: {
      newUsername: user?.username || "",
    },
  });

  const onPasswordSubmit = async (data: PasswordChangeFormData) => {
    setIsLoading(true);
    try {
      await auth.changePassword(data.currentPassword, data.newPassword);
      
      toast({
        title: "パスワード変更完了",
        description: "パスワードが正常に変更されました。再度ログインしてください。",
      });

      // Reset form
      passwordForm.reset();
      
      // Auto logout after password change for security
      setTimeout(async () => {
        await logout();
        router.push("/admin/login");
      }, 2000);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "パスワードの変更に失敗しました";
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onUsernameSubmit = async (data: UsernameChangeFormData) => {
    setIsUsernameLoading(true);
    try {
      await auth.changeUsername(data.newUsername, data.currentPassword);
      
      toast({
        title: "ユーザー名変更完了",
        description: "ユーザー名が正常に変更されました。",
      });

      // Reset form and refresh user data
      usernameForm.reset();
      await checkAuth(); // Refresh user data
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "ユーザー名の変更に失敗しました";
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUsernameLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">プロフィール設定</h1>
        <p className="text-muted-foreground">
          アカウント情報の管理とセキュリティ設定
        </p>
      </div>

      <div className="space-y-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>ユーザー情報</CardTitle>
            <CardDescription>
              現在のアカウント情報
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>ユーザー名</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {user?.username}
                </div>
              </div>
              <div>
                <Label>メールアドレス</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {user?.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Username Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              ユーザー名変更
            </CardTitle>
            <CardDescription>
              ログイン時に使用するユーザー名を変更できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={usernameForm.handleSubmit(onUsernameSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newUsername">新しいユーザー名</Label>
                <Input
                  id="newUsername"
                  {...usernameForm.register("newUsername")}
                  placeholder="新しいユーザー名を入力（3文字以上）"
                  disabled={isUsernameLoading}
                />
                {usernameForm.formState.errors.newUsername && (
                  <p className="text-sm text-destructive">{usernameForm.formState.errors.newUsername.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="usernameCurrentPassword">確認用パスワード</Label>
                <div className="relative">
                  <Input
                    id="usernameCurrentPassword"
                    type={showUsernamePassword ? "text" : "password"}
                    {...usernameForm.register("currentPassword")}
                    placeholder="現在のパスワードを入力"
                    disabled={isUsernameLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowUsernamePassword(!showUsernamePassword)}
                  >
                    {showUsernamePassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {usernameForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">{usernameForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isUsernameLoading}>
                  {isUsernameLoading ? "変更中..." : "ユーザー名を変更"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              パスワード変更
            </CardTitle>
            <CardDescription>
              セキュリティを強化するため、定期的なパスワード変更を推奨します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">現在のパスワード</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    {...passwordForm.register("currentPassword")}
                    placeholder="現在のパスワードを入力"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">新しいパスワード</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    {...passwordForm.register("newPassword")}
                    placeholder="新しいパスワードを入力（6文字以上）"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード確認</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...passwordForm.register("confirmPassword")}
                    placeholder="新しいパスワードを再入力"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "変更中..." : "パスワードを変更"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}