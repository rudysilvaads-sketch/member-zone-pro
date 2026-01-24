import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-6 py-12">
        <Link to="/auth">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Introdução</h2>
            <p className="text-muted-foreground leading-relaxed">
              Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais. 
              Ao usar nossa plataforma, você concorda com a coleta e uso de informações de acordo com esta política.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Informações que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Coletamos as seguintes informações:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Nome e email fornecidos no cadastro</li>
              <li>Foto de perfil (opcional)</li>
              <li>Dados de uso da plataforma (missões, pontos, conquistas)</li>
              <li>Histórico de compras e avaliações</li>
              <li>Informações de dispositivo e navegador</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Como Usamos suas Informações</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Fornecer e manter nosso serviço</li>
              <li>Personalizar sua experiência na plataforma</li>
              <li>Gerenciar seu progresso e recompensas</li>
              <li>Enviar notificações sobre missões e conquistas</li>
              <li>Melhorar nossos serviços</li>
              <li>Comunicar atualizações importantes</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Não vendemos suas informações pessoais. Podemos compartilhar dados apenas:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Com seu consentimento explícito</li>
              <li>Para cumprir obrigações legais</li>
              <li>Com prestadores de serviço que auxiliam nossa operação</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Segurança dos Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações, 
              incluindo criptografia de dados e autenticação segura. No entanto, nenhum método de transmissão 
              pela internet é 100% seguro.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Seus Direitos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você tem direito a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir informações incorretas</li>
              <li>Solicitar exclusão de seus dados</li>
              <li>Exportar seus dados</li>
              <li>Revogar consentimentos dados</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, 
              analisar o uso da plataforma e personalizar conteúdo. Você pode configurar 
              seu navegador para recusar cookies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos suas informações enquanto sua conta estiver ativa ou conforme necessário 
              para fornecer nossos serviços. Após exclusão da conta, alguns dados podem ser 
              mantidos para fins legais ou de backup.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Menores de Idade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nossa plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente 
              informações de menores. Se você é pai ou responsável e sabe que seu filho nos forneceu 
              dados pessoais, entre em contato conosco.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar nossa Política de Privacidade periodicamente. 
              Notificaremos sobre quaisquer alterações publicando a nova política nesta página 
              e atualizando a data de "última atualização".
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">11. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para questões sobre esta Política de Privacidade ou exercer seus direitos, 
              entre em contato através do chat da plataforma ou envie um email para nosso suporte.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            Veja também nossos{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Termos de Uso
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
