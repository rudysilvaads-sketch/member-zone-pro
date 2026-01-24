import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  Users, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getReferralStats } from '@/lib/referralService';
import { toast } from 'sonner';

interface InviteCardProps {
  baseUrl: string;
}

export function InviteCard({ baseUrl }: InviteCardProps) {
  const { userProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    referralCode: '',
    referralCount: 0,
    totalXpEarned: 0,
  });

  useEffect(() => {
    if (userProfile?.uid) {
      loadReferralStats();
    }
  }, [userProfile?.uid]);

  const loadReferralStats = async () => {
    if (!userProfile?.uid) return;
    
    try {
      const data = await getReferralStats(userProfile.uid);
      setStats(data);
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteLink = `${baseUrl}/auth?ref=${stats.referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Junte-se à nossa comunidade!',
          text: 'Entre na nossa comunidade exclusiva e ganhe recompensas incríveis!',
          url: inviteLink,
        });
      } catch (error) {
        // User cancelled or share failed
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Convide Amigos</CardTitle>
            <CardDescription>
              Ganhe <span className="text-primary font-semibold">+150 XP</span> por cada amigo que se cadastrar
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats.referralCount}</p>
              <p className="text-xs text-muted-foreground">Convites aceitos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-primary">+{stats.totalXpEarned}</p>
              <p className="text-xs text-muted-foreground">XP ganho</p>
            </div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Seu link de convite:</label>
          <div className="flex gap-2">
            <Input 
              value={inviteLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Referral Code Badge */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Código:</span>
          <Badge variant="secondary" className="font-mono">
            {stats.referralCode}
          </Badge>
        </div>

        {/* Share Button */}
        <Button onClick={handleShare} className="w-full" variant="gold">
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar Link
        </Button>
      </CardContent>
    </Card>
  );
}
