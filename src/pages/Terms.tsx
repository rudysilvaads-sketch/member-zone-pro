import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
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
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Termos de Uso</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e usar nossa plataforma, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
              Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nossa plataforma oferece um sistema de gamificação com missões, conquistas, rankings e produtos exclusivos. 
              Os usuários podem acumular pontos, subir de nível e trocar pontos por recompensas.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Conta do Usuário</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você é responsável por manter a confidencialidade de sua conta e senha. 
              Você concorda em notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Uso Aceitável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você concorda em usar a plataforma apenas para fins legais e de acordo com estes Termos. 
              É proibido:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Usar a plataforma de forma fraudulenta</li>
              <li>Tentar manipular o sistema de pontos</li>
              <li>Criar múltiplas contas</li>
              <li>Compartilhar credenciais de acesso</li>
              <li>Violar direitos de propriedade intelectual</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Pontos e Recompensas</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os pontos acumulados não têm valor monetário e não podem ser trocados por dinheiro. 
              Reservamo-nos o direito de modificar o sistema de pontos a qualquer momento.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo da plataforma, incluindo textos, gráficos, logos e software, 
              é de nossa propriedade e protegido por leis de direitos autorais.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              A plataforma é fornecida "como está", sem garantias de qualquer tipo. 
              Não nos responsabilizamos por danos indiretos resultantes do uso da plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Modificações</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. 
              Alterações significativas serão comunicadas através da plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre estes Termos de Uso, entre em contato através do chat da plataforma 
              ou envie um email para nosso suporte.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            Veja também nossa{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
