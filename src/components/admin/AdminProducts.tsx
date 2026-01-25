import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  ShoppingBag, 
  Plus, 
  Edit, 
  Trash2, 
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Bell,
  Send,
  Upload,
  X
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { toast } from 'sonner';
import { Product, notifyNewProduct } from '@/lib/firebaseServices';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const emptyProduct: Omit<Product, 'id'> = {
  name: '',
  description: '',
  price: 0,
  image: '',
  available: true,
  featured: false,
  requiredRank: '',
  category: 'other',
};

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [notifyOnCreate, setNotifyOnCreate] = useState(true);
  const [notifying, setNotifying] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const defaultProducts: Omit<Product, 'id'>[] = [
    // FERRAMENTAS IA & CRIAÇÃO
    {
      name: 'Google VO3 Ultra',
      description: '45.000 créditos para geração de vídeos com IA. Crie conteúdo profissional!',
      price: 5000,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/480px-Google_%22G%22_logo.svg.png',
      available: true,
      category: 'benefits',
      featured: true,
    },
    {
      name: 'CapCut Pro 30 Dias',
      description: 'Acesso completo ao CapCut Pro por 30 dias. Edite vídeos como um profissional!',
      price: 2500,
      image: 'https://sf16-va.tiktokcdn.com/obj/eden-va2/uvpohwj/ljhwZthlaukjlkulzlp/PC/Logo.png',
      available: true,
      category: 'benefits',
      featured: true,
    },
    {
      name: 'ChatGPT Pro 30 Dias',
      description: 'Acesso ao ChatGPT Pro por 30 dias. Use IA avançada para criar scripts e roteiros!',
      price: 3500,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/480px-ChatGPT_logo.svg.png',
      available: true,
      category: 'benefits',
      featured: true,
    },
    // PACKS & RECURSOS
    {
      name: 'Pack Elementor CSS',
      description: 'Pack completo de elementos CSS para Elementor. Acelere seu desenvolvimento!',
      price: 800,
      image: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=600&h=400&fit=crop',
      available: true,
      category: 'items',
      featured: true,
    },
    {
      name: 'App Disparo em Massa',
      description: 'Aplicativo para disparo em massa via WhatsApp. Automatize suas mensagens.',
      price: 1200,
      image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=400&fit=crop',
      available: true,
      category: 'items',
    },
    {
      name: 'Pack After Effects',
      description: 'Pack com 500 elementos UHD 4K para After Effects.',
      price: 750,
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop',
      available: true,
      category: 'items',
      featured: true,
    },
    {
      name: 'Prompts VEO 3',
      description: 'Coleção de prompts otimizados para geração de vídeos com IA.',
      price: 2500,
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop',
      available: true,
      category: 'benefits',
    },
    {
      name: 'Pack Edit Pro Kit',
      description: 'Kit básico de edição com mais de 2000 recursos.',
      price: 1800,
      image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=400&fit=crop',
      available: true,
      category: 'items',
    },
    // CURSOS
    {
      name: 'Catálogo de Cursos',
      description: 'Acesso ao catálogo completo de cursos da plataforma.',
      price: 500,
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
      available: true,
      category: 'courses',
      requiredRank: 'gold',
    },
    {
      name: 'Método IA do Job',
      description: 'Aprenda a usar IA para conseguir oportunidades de trabalho.',
      price: 3000,
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
      available: true,
      category: 'courses',
      requiredRank: 'platinum',
      featured: true,
    },
    {
      name: 'Tema Express Shopify',
      description: 'Tema profissional e otimizado para lojas Shopify.',
      price: 1500,
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
      available: true,
      category: 'items',
    },
  ];

  const fetchProducts = async () => {
    try {
      const productsSnap = await getDocs(collection(db, 'products'));
      const productsData = productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedProducts = async () => {
    setSaving(true);
    try {
      for (const product of defaultProducts) {
        const docId = product.name.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, 'products', docId), product);
      }
      toast.success(`${defaultProducts.length} produtos adicionados!`);
      fetchProducts();
    } catch (error) {
      console.error('Error seeding products:', error);
      toast.error('Erro ao adicionar produtos');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      available: product.available,
      featured: product.featured || false,
      requiredRank: product.requiredRank || '',
      category: product.category || 'other',
    });
    setImagePreview(product.image || null);
    setDialogOpen(true);
  };

  const processImageFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB');
      return;
    }

    setUploading(true);
    try {
      // Create unique filename
      const timestamp = Date.now();
      const filename = `products/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, filename);

      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      setFormData({ ...formData, image: downloadURL });
      setImagePreview(downloadURL);
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processImageFile(files[0]);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: '' });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNotifyProduct = async (product: Product) => {
    setNotifying(product.id);
    try {
      const count = await notifyNewProduct(product);
      if (count > 0) {
        toast.success(`${count} usuários notificados sobre "${product.name}"`);
      } else {
        toast.info('Nenhum usuário para notificar');
      }
    } catch (error) {
      console.error('Error notifying:', error);
      toast.error('Erro ao enviar notificações');
    } finally {
      setNotifying(null);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Preencha nome e preço');
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        // Update existing
        await updateDoc(doc(db, 'products', editingProduct.id), formData);
        toast.success('Produto atualizado!');
      } else {
        // Create new
        const docId = formData.name.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, 'products', docId), formData);
        toast.success('Produto criado!');
        
        // Notify users if enabled
        if (notifyOnCreate) {
          const newProduct: Product = { id: docId, ...formData };
          const count = await notifyNewProduct(newProduct);
          if (count > 0) {
            toast.success(`${count} usuários notificados!`);
          }
        }
      }
      
      setDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Excluir "${product.name}"?`)) return;
    
    try {
      await deleteDoc(doc(db, 'products', product.id));
      toast.success('Produto excluído!');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{products.length} produtos</Badge>
        <Button variant="gold" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <Card 
            key={product.id} 
            variant="gradient"
            className="animate-fade-in overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative aspect-video overflow-hidden">
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {product.featured && (
                <Badge variant="gold" className="absolute top-2 left-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Destaque
                </Badge>
              )}
              {!product.available && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Badge variant="secondary">Indisponível</Badge>
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {product.description}
                  </p>
                  {product.requiredRank && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Requer: {product.requiredRank}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <p className="text-xl font-bold text-primary">
                  {product.price.toLocaleString()} <span className="text-sm">pts</span>
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Notificar usuários"
                    onClick={() => handleNotifyProduct(product)}
                    disabled={notifying === product.id}
                  >
                    {notifying === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(product)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card variant="gradient" className="py-12 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Nenhum produto cadastrado</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleSeedProducts} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Adicionar Produtos de Exemplo
            </Button>
            <Button variant="gold" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Produto
            </Button>
          </div>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do produto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do produto"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do produto"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Preço (pontos)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Imagem do Produto</Label>
              
              {/* Image preview */}
              {imagePreview && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-secondary border border-border">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Upload area with drag & drop */}
              {!imagePreview && (
                <div 
                  className={`relative w-full aspect-video rounded-lg border-2 border-dashed bg-secondary/30 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                    isDragging 
                      ? 'border-primary bg-primary/10 scale-[1.02]' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                      <p className="text-sm text-muted-foreground">Enviando...</p>
                    </>
                  ) : isDragging ? (
                    <>
                      <Upload className="h-10 w-10 text-primary mb-2 animate-bounce" />
                      <p className="text-sm font-medium text-primary">Solte a imagem aqui</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Arraste uma imagem ou clique aqui</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG até 5MB</p>
                    </>
                  )}
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {/* URL input as alternative */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">ou cole uma URL</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => {
                  setFormData({ ...formData, image: e.target.value });
                  setImagePreview(e.target.value || null);
                }}
                placeholder="https://..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category || 'other'}
                onValueChange={(value) => setFormData({ ...formData, category: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avatars">Avatares</SelectItem>
                  <SelectItem value="items">Itens</SelectItem>
                  <SelectItem value="benefits">Benefícios</SelectItem>
                  <SelectItem value="courses">Cursos</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requiredRank">Rank Necessário (opcional)</Label>
              <Select
                value={formData.requiredRank || 'none'}
                onValueChange={(value) => setFormData({ ...formData, requiredRank: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem restrição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem restrição</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Prata</SelectItem>
                  <SelectItem value="gold">Ouro</SelectItem>
                  <SelectItem value="platinum">Platina</SelectItem>
                  <SelectItem value="diamond">Diamante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="available">Disponível</Label>
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="featured">Destaque</Label>
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
            </div>
            
            {!editingProduct && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <Label htmlFor="notify" className="text-sm">Notificar usuários</Label>
                </div>
                <Switch
                  id="notify"
                  checked={notifyOnCreate}
                  onCheckedChange={setNotifyOnCreate}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gold" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : notifyOnCreate && !editingProduct ? (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Salvar e Notificar
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
