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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Wrench, 
  Code, 
  Sparkles, 
  BookOpen, 
  Check,
  X,
  Eye,
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Tool, 
  ToolCategory,
  ToolStatus,
  subscribeToAllTools, 
  approveTool,
  rejectTool,
  deleteTool,
  updateToolContent,
  getCategoryLabel,
  getCategoryColor,
  getStatusLabel,
  getStatusColor
} from '@/lib/toolsService';

const categoryIcons: Record<ToolCategory, React.ReactNode> = {
  prompt: <Sparkles className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
  tool: <Wrench className="h-4 w-4" />,
  tutorial: <BookOpen className="h-4 w-4" />,
};

interface AdminToolsModerationProps {
  isAdmin: boolean;
}

export const AdminToolsModeration = ({ isAdmin }: AdminToolsModerationProps) => {
  const { userProfile } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Edit form
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<ToolCategory>('prompt');
  const [editTags, setEditTags] = useState('');

  useEffect(() => {
    const status = activeTab === 'all' ? undefined : activeTab;
    const unsubscribe = subscribeToAllTools((toolsData) => {
      setTools(toolsData);
      setLoading(false);
    }, status as ToolStatus | undefined);

    return () => unsubscribe();
  }, [activeTab]);

  const pendingCount = tools.filter(t => t.status === 'pending').length;
  const approvedCount = tools.filter(t => t.status === 'approved').length;
  const rejectedCount = tools.filter(t => t.status === 'rejected').length;

  const handleApprove = async (tool: Tool) => {
    if (!userProfile) return;
    
    setProcessing(tool.id);
    const success = await approveTool(tool.id, userProfile.uid);
    
    if (success) {
      toast.success('Recurso aprovado com sucesso!');
    } else {
      toast.error('Erro ao aprovar recurso');
    }
    setProcessing(null);
  };

  const handleReject = async () => {
    if (!selectedTool || !userProfile || !rejectionReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    
    setProcessing(selectedTool.id);
    const success = await rejectTool(selectedTool.id, userProfile.uid, rejectionReason.trim());
    
    if (success) {
      toast.success('Recurso rejeitado');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedTool(null);
    } else {
      toast.error('Erro ao rejeitar recurso');
    }
    setProcessing(null);
  };

  const handleDelete = async () => {
    if (!selectedTool) return;
    
    setProcessing(selectedTool.id);
    const success = await deleteTool(selectedTool.id);
    
    if (success) {
      toast.success('Recurso excluído');
      setDeleteDialogOpen(false);
      setSelectedTool(null);
    } else {
      toast.error('Erro ao excluir recurso');
    }
    setProcessing(null);
  };

  const handleEdit = async () => {
    if (!selectedTool) return;
    
    setProcessing(selectedTool.id);
    const success = await updateToolContent(selectedTool.id, {
      title: editTitle,
      description: editDescription,
      content: editContent,
      category: editCategory,
      tags: editTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t),
    });
    
    if (success) {
      toast.success('Recurso atualizado');
      setEditDialogOpen(false);
      setSelectedTool(null);
    } else {
      toast.error('Erro ao atualizar recurso');
    }
    setProcessing(null);
  };

  const openRejectDialog = (tool: Tool) => {
    setSelectedTool(tool);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const openDeleteDialog = (tool: Tool) => {
    setSelectedTool(tool);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (tool: Tool) => {
    setSelectedTool(tool);
    setEditTitle(tool.title);
    setEditDescription(tool.description || '');
    setEditContent(tool.content);
    setEditCategory(tool.category);
    setEditTags(tool.tags?.join(', ') || '');
    setEditDialogOpen(true);
  };

  const openViewDialog = (tool: Tool) => {
    setSelectedTool(tool);
    setViewDialogOpen(true);
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

  const renderToolCard = (tool: Tool, showModerationActions: boolean = true) => (
    <Card key={tool.id} className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header with status and category */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn("gap-1", getCategoryColor(tool.category))}
            >
              {categoryIcons[tool.category]}
              {getCategoryLabel(tool.category)}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(getStatusColor(tool.status))}
            >
              {tool.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
              {tool.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
              {tool.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
              {getStatusLabel(tool.status)}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(tool.createdAt)}
          </span>
        </div>

        {/* Author info */}
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={tool.userAvatar || undefined} />
            <AvatarFallback>
              {tool.userName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{tool.userName}</p>
            <p className="text-xs text-muted-foreground">Nível {tool.userLevel}</p>
          </div>
        </div>

        {/* Title and description */}
        <div>
          <h3 className="font-semibold">{tool.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {tool.description || tool.content.substring(0, 150)}...
          </p>
        </div>

        {/* Tags */}
        {tool.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tool.tags.slice(0, 5).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Rejection reason */}
        {tool.status === 'rejected' && tool.rejectionReason && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span><strong>Motivo:</strong> {tool.rejectionReason}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => openViewDialog(tool)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
          
          {showModerationActions && tool.status === 'pending' && (
            <>
              <Button 
                variant="default" 
                size="sm"
                disabled={processing === tool.id}
                onClick={() => handleApprove(tool)}
                className="bg-green-600 hover:bg-green-700"
              >
                {processing === tool.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Aprovar
                  </>
                )}
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                disabled={processing === tool.id}
                onClick={() => openRejectDialog(tool)}
              >
                <X className="h-4 w-4 mr-1" />
                Rejeitar
              </Button>
            </>
          )}

          {/* Admin-only actions */}
          {isAdmin && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openEditDialog(tool)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => openDeleteDialog(tool)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Moderação de Ferramentas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pendentes
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Aprovados
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="h-4 w-4" />
                Rejeitados
              </TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tools.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum recurso {activeTab !== 'all' ? getStatusLabel(activeTab) : ''} encontrado.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {tools.map((tool) => renderToolCard(tool))}
                </div>
              </ScrollArea>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTool?.title}</DialogTitle>
          </DialogHeader>
          {selectedTool && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={cn("gap-1", getCategoryColor(selectedTool.category))}
                >
                  {categoryIcons[selectedTool.category]}
                  {getCategoryLabel(selectedTool.category)}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn(getStatusColor(selectedTool.status))}
                >
                  {getStatusLabel(selectedTool.status)}
                </Badge>
              </div>

              {selectedTool.description && (
                <p className="text-muted-foreground">{selectedTool.description}</p>
              )}

              <div className="bg-muted rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {selectedTool.content}
                </pre>
              </div>

              {selectedTool.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTool.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">#{tag}</Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedTool.userAvatar || undefined} />
                  <AvatarFallback>
                    {selectedTool.userName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{selectedTool.userName}</span>
                <span>•</span>
                <span>Nível {selectedTool.userLevel}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Recurso</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O usuário será notificado.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da rejeição..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processing !== null}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Recurso</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{selectedTool?.title}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={processing !== null}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog (Admin only) */}
      {isAdmin && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Recurso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <Select value={editCategory} onValueChange={(v) => setEditCategory(v as ToolCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prompt">Prompt</SelectItem>
                      <SelectItem value="code">Código</SelectItem>
                      <SelectItem value="tool">Ferramenta</SelectItem>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <Input 
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Título</label>
                <Input 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Descrição</label>
                <Input 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Conteúdo</label>
                <Textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  maxLength={5000}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleEdit}
                disabled={!editTitle.trim() || !editContent.trim() || processing !== null}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};