import React, { useState } from 'react';
import { ref, set, get } from 'firebase/database';
import { database } from '../../firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner@2.0.3';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('パスワードが一致しません。');
      return;
    }

    setLoading(true);

    try {
      // Check if username already exists
      const userRef = ref(database, `users/${username}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        toast.error('このユーザー名は既に使用されています。');
        setLoading(false);
        return;
      }

      // Create new user
      await set(userRef, {
        email,
        password,
        approved: false,
        points: 0,
        rank: 'member'
      });

      toast.success('アカウントが作成されました。管理者の承認をお待ちください。');
      onSwitchToLogin();
    } catch (error) {
      console.error('Register error:', error);
      toast.error('登録に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">新規登録</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
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
            <label htmlFor="email">メールアドレス</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="メールアドレスを入力"
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
          <div>
            <label htmlFor="confirmPassword">パスワード確認</label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="パスワードを再入力"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登録中...' : '登録'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={onSwitchToLogin}
          >
            ログインに戻る
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}