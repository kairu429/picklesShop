import React, { useState, useEffect } from 'react';
import { ref, get, update } from 'firebase/database';
import { database } from '../../firebase';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { User, Settings } from 'lucide-react';

interface UserDashboardProps {
  currentUser: any;
  onUserUpdate: (updatedUser: any) => void;
}

export function UserDashboard({ currentUser, onUserUpdate }: UserDashboardProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);



  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (oldPassword !== currentUser.password) {
      toast.error('現在のパスワードが間違っています。');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('新しいパスワードが一致しません。');
      return;
    }

    if (newPassword.length < 4) {
      toast.error('パスワードは4文字以上で入力してください。');
      return;
    }

    setChangingPassword(true);

    try {
      await update(ref(database, `users/${currentUser.uid}`), {
        password: newPassword
      });

      const updatedUser = { ...currentUser, password: newPassword };
      onUserUpdate(updatedUser);
      
      toast.success('パスワードを変更しました。');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('パスワード変更に失敗しました。');
    } finally {
      setChangingPassword(false);
    }
  };



  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">マイページ</h1>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            アカウント情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ユーザー名</p>
              <p className="font-medium">{currentUser.uid}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">メールアドレス</p>
              <p className="font-medium">{currentUser.email || '未設定'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ランク</p>
              <Badge variant="outline">{currentUser.rank}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">承認状態</p>
              <Badge variant={currentUser.approved ? 'default' : 'destructive'}>
                {currentUser.approved ? '承認済み' : '承認待ち'}
              </Badge>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">保有ポイント</p>
            <p className="text-2xl font-bold text-green-600">{currentUser.points} pt</p>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            アカウント設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <h3 className="font-medium">パスワード変更</h3>
            
            <div className="space-y-2">
              <label htmlFor="oldPassword">現在のパスワード</label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword">新しいパスワード</label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={4}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword">新しいパスワード確認</label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={4}
              />
            </div>

            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? 'パスワード変更中...' : 'パスワードを変更'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}