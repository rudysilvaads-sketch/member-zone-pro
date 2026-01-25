import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Wrench, 
  Code, 
  Sparkles, 
  BookOpen, 
  Plus, 
  Heart, 
  Bookmark,
  Eye,
  Copy,
  Check,
  MoreHorizontal,
  Trash2,
  Loader2,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Tool, 
  ToolCategory, 
  subscribeToTools, 
  createTool, 
  toggleLikeTool,
  toggleSaveTool,
  deleteTool,
  getCategoryLabel,
  getCategoryColor,
  incrementToolViews
} from '@/lib/toolsService';

const categoryIcons: Record<ToolCategory, React.ReactNode> = {
  prompt: <Sparkles className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
  tool: <Wrench className="h-4 w-4" />,
  tutorial: <BookOpen className="h-4 w-4" />,
};

const rankConfig: Record<string, { color: string; bg: string }> = {
  bronze: { color: "text-orange-400", bg: "bg-orange-500/20" },
  silver: { color: "text-slate-300", bg: "bg-slate-400/20" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
  platinum: { color: "text-cyan-400", bg: "bg-cyan-500/20" },
  diamond: { color: "text-purple-400", bg: "bg-purple-500/20" },
};

export const ToolsTab = () => {
  const { userProfile } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<ToolCategory>('prompt');
  const [newTags, setNewTags] = useState('');
  const [creating, setCreating] = useState(false);

  // Subscribe to tools
  useEffect(() => {
    const category = selectedCategory === 'all' ? undefined : selectedCategory;
    const unsubscribe = subscribeToTools((toolsData) => {
      setTools(toolsData);
      setLoading(false);
    }, category);

    return () => unsubscribe();
  }, [selectedCategory]);

  const handleCreate = async () => {
    if (!userProfile || !newTitle.trim() || !newContent.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setCreating(true);
    
    const tags = newTags.split(',').map(t => t.trim()).filter(t => t);
    
    const result = await createTool(
      userProfile.uid,
      userProfile.displayName,
      userProfile.photoURL,
      userProfile.level || 1,
      userProfile.rank || 'bronze',
      newTitle,
      newDescription,
      newContent,
      newCategory,
      tags
    );

    if (result.success) {
      toast.success('Recurso enviado para aprovação! Você receberá XP após a aprovação.');
      setCreateDialogOpen(false);
      resetForm();
    } else {
      toast.error(result.error || 'Erro ao criar recurso');
    }
    
    setCreating(false);
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewContent('');
    setNewCategory('prompt');
    setNewTags('');
  };

  const handleLike = async (tool: Tool) => {
    if (!userProfile) return;
    await toggleLikeTool(tool.id, userProfile.uid, tool.userId);
  };

  const handleSave = async (tool: Tool) => {
    if (!userProfile) return;
    const success = await toggleSaveTool(tool.id, userProfile.uid, tool.userId);
    if (success) {
      const hasSaved = tool.saves?.includes(userProfile.uid);
      toast.success(hasSaved ? 'Removido dos salvos' : 'Salvo com sucesso!');
    }
  };

  const handleDelete = async (toolId: string) => {
    const success = await deleteTool(toolId);
    if (success) {
      toast.success('Recurso deletado');
    } else {
      toast.error('Erro ao deletar');
    }
  };

  const handleView = async (tool: Tool) => {
    setSelectedTool(tool);
    setViewDialogOpen(true);
    await incrementToolViews(tool.id);
  };

  const handleCopy = (content: string, toolId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(toolId);
    toast.success('Copiado para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const isAdmin = (userProfile as any)?.isAdmin;

  return (
    <div className="space-y-4">
      {/* Header with filters and create button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ToolCategory | 'all')}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="prompt" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-1">
              <Code className="h-3 w-3" />
              Códigos
            </TabsTrigger>
            <TabsTrigger value="tool" className="gap-1">
              <Wrench className="h-3 w-3" />
              Ferramentas
            </TabsTrigger>
            <TabsTrigger value="tutorial" className="gap-1">
              <BookOpen className="h-3 w-3" />
              Tutoriais
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Compartilhar Recurso
        </Button>
      </div>

      {/* Tools Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tools.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum recurso compartilhado ainda.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              Seja o primeiro a compartilhar!
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => {
            const rank = rankConfig[tool.userRank] || rankConfig.bronze;
            const hasLiked = tool.likes?.includes(userProfile?.uid || '');
            const hasSaved = tool.saves?.includes(userProfile?.uid || '');
            
            return (
              <Card 
                key={tool.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleView(tool)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Category Badge */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={cn("gap-1", getCategoryColor(tool.category))}
                    >
                      {categoryIcons[tool.category]}
                      {getCategoryLabel(tool.category)}
                    </Badge>
                    
                    {(tool.userId === userProfile?.uid || isAdmin) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(tool.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Title and Description */}
                  <div>
                    <h3 className="font-semibold line-clamp-1">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {tool.description || tool.content.substring(0, 100)}
                    </p>
                  </div>

                  {/* Tags */}
                  {tool.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tool.tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {tool.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{tool.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Author and Stats */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={tool.userAvatar || undefined} />
                        <AvatarFallback className={cn("text-xs", rank.bg, rank.color)}>
                          {tool.userName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {tool.userName} • {formatTimeAgo(tool.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className={cn("h-3 w-3", hasLiked && "fill-red-500 text-red-500")} />
                        {tool.likes?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className={cn("h-3 w-3", hasSaved && "fill-primary text-primary")} />
                        {tool.saves?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {tool.views || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Compartilhar Recurso
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria *</label>
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as ToolCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prompt">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Prompt
                      </span>
                    </SelectItem>
                    <SelectItem value="code">
                      <span className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Código
                      </span>
                    </SelectItem>
                    <SelectItem value="tool">
                      <span className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Ferramenta
                      </span>
                    </SelectItem>
                    <SelectItem value="tutorial">
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Tutorial
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags (separadas por vírgula)</label>
                <Input 
                  placeholder="ia, chatgpt, automação..."
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Título *</label>
              <Input 
                placeholder="Ex: Prompt para gerar textos de vendas"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Descrição breve</label>
              <Input 
                placeholder="Uma breve descrição do recurso..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                maxLength={200}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Conteúdo *</label>
              <Textarea 
                placeholder={
                  newCategory === 'prompt' 
                    ? "Cole seu prompt aqui..." 
                    : newCategory === 'code'
                    ? "Cole seu código aqui..."
                    : newCategory === 'tool'
                    ? "Descreva a ferramenta, link, como usar..."
                    : "Escreva seu tutorial aqui..."
                }
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {newContent.length}/5000
              </p>
            </div>

            <div className="bg-primary/10 rounded-lg p-3 text-sm">
              <p className="font-medium text-primary">🎁 Recompensa: +50 XP + 10 Pontos (após aprovação)</p>
              <p className="text-muted-foreground text-xs mt-1">
                Seu recurso será analisado pela moderação antes de ser publicado. Você também ganha XP quando outros usuários curtem ou salvam seu recurso!
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={creating || !newTitle.trim() || !newContent.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publicar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTool && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="outline" 
                    className={cn("gap-1", getCategoryColor(selectedTool.category))}
                  >
                    {categoryIcons[selectedTool.category]}
                    {getCategoryLabel(selectedTool.category)}
                  </Badge>
                </div>
                <DialogTitle>{selectedTool.title}</DialogTitle>
                {selectedTool.description && (
                  <p className="text-sm text-muted-foreground">{selectedTool.description}</p>
                )}
              </DialogHeader>

              <div className="space-y-4">
                {/* Author info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedTool.userAvatar || undefined} />
                      <AvatarFallback>
                        {selectedTool.userName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedTool.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        Lv.{selectedTool.userLevel} • {formatTimeAgo(selectedTool.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(selectedTool.content, selectedTool.id)}
                    >
                      {copiedId === selectedTool.id ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {selectedTool.content}
                  </pre>
                </div>

                {/* Tags */}
                {selectedTool.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTool.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(selectedTool)}
                    className={cn(
                      selectedTool.likes?.includes(userProfile?.uid || '') && "text-red-500"
                    )}
                  >
                    <Heart className={cn(
                      "h-4 w-4 mr-1",
                      selectedTool.likes?.includes(userProfile?.uid || '') && "fill-red-500"
                    )} />
                    {selectedTool.likes?.length || 0} curtidas
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSave(selectedTool)}
                    className={cn(
                      selectedTool.saves?.includes(userProfile?.uid || '') && "text-primary"
                    )}
                  >
                    <Bookmark className={cn(
                      "h-4 w-4 mr-1",
                      selectedTool.saves?.includes(userProfile?.uid || '') && "fill-primary"
                    )} />
                    {selectedTool.saves?.length || 0} salvos
                  </Button>

                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {selectedTool.views || 0} visualizações
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
