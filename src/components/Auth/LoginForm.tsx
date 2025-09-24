import React, { useState } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner@2.0.3';

interface LoginFormProps {
  onLogin: (user: any) => void;
  onSwitchToRegister: () => void;
}

export function LoginForm({ onLogin, onSwitchToRegister }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userRef = ref(database, `users/${username}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.password === password) {
          if (userData.approved) {
            onLogin({ 
              username, 
              ...userData,
              uid: username 
            });
            toast.success('ログインしました！');
          } else {
            toast.error('アカウントが承認されていません。管理者の承認をお待ちください。');
          }
        } else {
          toast.error('パスワードが間違っています。');
        }
      } else {
        toast.error('ユーザーが見つかりません。');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('ログインに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">PicklesShop ログイン</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username">ユーザー名</label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="ユーザー名を入力"
            />
          </div>
          <div>
            <label htmlFor="password">パスワード</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="パスワードを入力"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={onSwitchToRegister}
          >
            新規登録
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}