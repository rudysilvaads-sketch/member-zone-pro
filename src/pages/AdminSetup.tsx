import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { initializeDefaultData } from '@/lib/firebaseServices';
import { toast } from 'sonner';
import { Database, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminSetup() {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  const handleInitialize = async () => {
    setLoading(true);
    try {
      await initializeDefaultData();
      setCompleted(true);
      toast.success('Dados inicializados com sucesso!');
    } catch (error) {
      console.error('Error initializing data:', error);
      toast.error('Erro ao inicializar dados. Verifique as permissões do Firestore.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card variant="gradient" className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 ${completed ? 'bg-success' : 'bg-gradient-gold shadow-glow-gold'}`}>
            {completed ? (
              <CheckCircle className="h-8 w-8 text-success-foreground" />
            ) : (
              <Database className="h-8 w-8 text-primary-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {completed ? 'Configuração Concluída!' : 'Configurar Firestore'}
          </CardTitle>
          <CardDescription>
            {completed 
              ? 'Os dados foram criados com sucesso no seu banco de dados.'
              : 'Clique no botão abaixo para criar as conquistas e produtos iniciais no Firestore.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!completed ? (
            <>
              <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">Isso irá criar:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>6 conquistas (Primeiro Passo, Em Chamas, etc.)</li>
                  <li>3 produtos (Curso Avançado, Mentoria VIP, Badge)</li>
                </ul>
              </div>
              
              <Button 
                variant="gold" 
                className="w-full" 
                size="lg"
                onClick={handleInitialize}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Inicializando...
                  </>
                ) : (
                  <>
                    <Database className="h-5 w-5 mr-2" />
                    Inicializar Dados
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button 
              variant="gold" 
              className="w-full" 
              size="lg"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Ir para o Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
