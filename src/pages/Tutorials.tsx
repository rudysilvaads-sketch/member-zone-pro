import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  GraduationCap, Play, ChevronDown, ChevronRight, Plus, 
  Trash2, Edit2, Loader2, BookOpen, Video, Clock, X,
  ExternalLink, CheckCircle2, Trophy, Target, Timer,
  Settings, ArrowUp, ArrowDown, Eye, EyeOff, BarChart3,
  Users, Copy, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  TutorialTopic,
  TutorialLesson,
  subscribeToTopics,
  subscribeToLessons,
  createTopic,
  updateTopic,
  deleteTopic,
  createLesson,
  updateLesson,
  deleteLesson,
  getYoutubeThumbnail,
  getYoutubeEmbedUrl,
  extractYoutubeId,
  awardLessonXp,
  awardTopicCompletionXp,
  TUTORIAL_XP_REWARDS,
} from "@/lib/tutorialsService";
import { completeMission } from "@/lib/missionService";

// Admin emails list
const ADMIN_EMAILS = ['rudysilvaads@gmail.com'];

const Tutorials = () => {
  const { user, userProfile } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [topics, setTopics] = useState<TutorialTopic[]>([]);
  const [lessonsMap, setLessonsMap] = useState<Record<string, TutorialLesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  
  // Video player state
  const [currentLesson, setCurrentLesson] = useState<TutorialLesson | null>(null);
  const [currentTopic, setCurrentTopic] = useState<TutorialTopic | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  
  // Admin dialogs
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TutorialTopic | null>(null);
  const [editingLesson, setEditingLesson] = useState<TutorialLesson | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  
  // Form states
  const [topicForm, setTopicForm] = useState({ title: '', description: '', thumbnailUrl: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', youtubeUrl: '', duration: '' });
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  
  // Check admin access
  const isAdmin = user && (
    ADMIN_EMAILS.includes(user.email || '') || 
    (userProfile as any)?.isAdmin || 
    (userProfile as any)?.role === 'admin'
  );
  const isModerator = (userProfile as any)?.isModerator || (userProfile as any)?.role === 'moderator';
  const hasAdminAccess = isAdmin || isModerator;

  // Subscribe to topics
  useEffect(() => {
    const unsubscribe = subscribeToTopics((topicsData) => {
      setTopics(topicsData);
      setLoading(false);
      
      // Auto-expand first topic if none expanded
      if (topicsData.length > 0 && expandedTopics.size === 0) {
        setExpandedTopics(new Set([topicsData[0].id]));
      }
    }, !hasAdminAccess); // Show only published for non-admins
    
    return () => unsubscribe();
  }, [hasAdminAccess]);

  // Subscribe to lessons for expanded topics
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    expandedTopics.forEach(topicId => {
      if (!lessonsMap[topicId]) {
        const unsubscribe = subscribeToLessons(topicId, (lessons) => {
          setLessonsMap(prev => ({ ...prev, [topicId]: lessons }));
        });
        unsubscribes.push(unsubscribe);
      }
    });
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [expandedTopics]);

  // Load completed lessons from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`completedLessons_${user.uid}`);
      if (saved) {
        setCompletedLessons(new Set(JSON.parse(saved)));
      }
    }
  }, [user]);

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const playLesson = (lesson: TutorialLesson, topic: TutorialTopic) => {
    setCurrentLesson(lesson);
    setCurrentTopic(topic);
  };

  const markAsCompleted = async (lessonId: string) => {
    if (!user || !currentTopic) return;
    
    const isAlreadyCompleted = completedLessons.has(lessonId);
    
    // Toggle completion state
    setCompletedLessons(prev => {
      const next = new Set(prev);
      if (isAlreadyCompleted) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      localStorage.setItem(`completedLessons_${user.uid}`, JSON.stringify([...next]));
      return next;
    });
    
    // If marking as completed (not uncompleting), award XP
    if (!isAlreadyCompleted) {
      // Award lesson XP
      const lessonReward = await awardLessonXp(user.uid);
      
      if (lessonReward.success) {
        toast.success(`Aula concluída! +${lessonReward.xp} XP 🎉`);
      }
      
      // Complete the watch-tutorial daily mission
      const missionResult = await completeMission(user.uid, 'watch-tutorial');
      if (missionResult.completed && missionResult.rewards) {
        toast.success(`🎯 Missão Completada: ${missionResult.rewards.title} (+${missionResult.rewards.xp} XP)`);
      }
      
      // Check if entire topic is now completed
      const topicLessons = lessonsMap[currentTopic.id] || [];
      const updatedCompleted = new Set(completedLessons);
      updatedCompleted.add(lessonId);
      
      const allTopicLessonsCompleted = topicLessons.every(l => updatedCompleted.has(l.id));
      
      if (allTopicLessonsCompleted && topicLessons.length > 0) {
        // Award topic completion bonus
        const topicReward = await awardTopicCompletionXp(user.uid, currentTopic.title);
        
        if (topicReward.success) {
          toast.success(`🎓 Tópico "${currentTopic.title}" concluído! +${topicReward.xp} XP bônus!`, {
            duration: 5000,
          });
        }
      }
    }
  };

  const goToNextLesson = () => {
    if (!currentTopic || !currentLesson) return;
    
    const lessons = lessonsMap[currentTopic.id] || [];
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    
    if (currentIndex < lessons.length - 1) {
      setCurrentLesson(lessons[currentIndex + 1]);
    }
  };

  const goToPrevLesson = () => {
    if (!currentTopic || !currentLesson) return;
    
    const lessons = lessonsMap[currentTopic.id] || [];
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    
    if (currentIndex > 0) {
      setCurrentLesson(lessons[currentIndex - 1]);
    }
  };

  // Admin functions
  const openTopicDialog = (topic?: TutorialTopic) => {
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({
        title: topic.title,
        description: topic.description,
        thumbnailUrl: topic.thumbnailUrl || '',
      });
    } else {
      setEditingTopic(null);
      setTopicForm({ title: '', description: '', thumbnailUrl: '' });
    }
    setShowTopicDialog(true);
  };

  const openLessonDialog = (topicId: string, lesson?: TutorialLesson) => {
    setSelectedTopicId(topicId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        description: lesson.description,
        youtubeUrl: lesson.youtubeUrl,
        duration: lesson.duration || '',
      });
    } else {
      setEditingLesson(null);
      setLessonForm({ title: '', description: '', youtubeUrl: '', duration: '' });
    }
    setShowLessonDialog(true);
  };

  const handleSaveTopic = async () => {
    if (!topicForm.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    
    setSaving(true);
    try {
      if (editingTopic) {
        const success = await updateTopic(editingTopic.id, {
          title: topicForm.title,
          description: topicForm.description,
          thumbnailUrl: topicForm.thumbnailUrl || undefined,
        });
        if (success) {
          toast.success('Tópico atualizado!');
          setShowTopicDialog(false);
        } else {
          toast.error('Erro ao atualizar');
        }
      } else {
        const result = await createTopic(
          topicForm.title,
          topicForm.description,
          user?.uid || '',
          topicForm.thumbnailUrl || undefined
        );
        if (result.success) {
          toast.success('Tópico criado!');
          setShowTopicDialog(false);
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim() || !lessonForm.youtubeUrl.trim() || !selectedTopicId) {
      toast.error('Título e URL do YouTube são obrigatórios');
      return;
    }
    
    const youtubeId = extractYoutubeId(lessonForm.youtubeUrl);
    if (!youtubeId) {
      toast.error('URL do YouTube inválida');
      return;
    }
    
    setSaving(true);
    try {
      if (editingLesson) {
        const success = await updateLesson(editingLesson.id, {
          title: lessonForm.title,
          description: lessonForm.description,
          youtubeUrl: lessonForm.youtubeUrl,
          duration: lessonForm.duration || undefined,
        });
        if (success) {
          toast.success('Aula atualizada!');
          setShowLessonDialog(false);
        } else {
          toast.error('Erro ao atualizar');
        }
      } else {
        const result = await createLesson(
          selectedTopicId,
          lessonForm.title,
          lessonForm.description,
          lessonForm.youtubeUrl,
          lessonForm.duration || undefined
        );
        if (result.success) {
          toast.success('Aula criada!');
          setShowLessonDialog(false);
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Excluir este tópico e todas as aulas?')) return;
    
    const success = await deleteTopic(topicId);
    if (success) {
      toast.success('Tópico excluído');
    } else {
      toast.error('Erro ao excluir');
    }
  };

  const handleDeleteLesson = async (lessonId: string, topicId: string) => {
    if (!confirm('Excluir esta aula?')) return;
    
    const success = await deleteLesson(lessonId, topicId);
    if (success) {
      toast.success('Aula excluída');
      if (currentLesson?.id === lessonId) {
        setCurrentLesson(null);
      }
    } else {
      toast.error('Erro ao excluir');
    }
  };

  const handleTogglePublish = async (topic: TutorialTopic) => {
    const success = await updateTopic(topic.id, { isPublished: !topic.isPublished });
    if (success) {
      toast.success(topic.isPublished ? 'Tópico despublicado' : 'Tópico publicado!');
    }
  };

  // Admin: Move topic up/down
  const handleMoveTopicUp = async (topic: TutorialTopic, index: number) => {
    if (index === 0) return;
    setReordering(true);
    
    const prevTopic = topics[index - 1];
    
    await Promise.all([
      updateTopic(topic.id, { order: topic.order - 1 }),
      updateTopic(prevTopic.id, { order: prevTopic.order + 1 }),
    ]);
    
    setReordering(false);
    toast.success('Ordem atualizada');
  };

  const handleMoveTopicDown = async (topic: TutorialTopic, index: number) => {
    if (index >= topics.length - 1) return;
    setReordering(true);
    
    const nextTopic = topics[index + 1];
    
    await Promise.all([
      updateTopic(topic.id, { order: topic.order + 1 }),
      updateTopic(nextTopic.id, { order: nextTopic.order - 1 }),
    ]);
    
    setReordering(false);
    toast.success('Ordem atualizada');
  };

  // Admin: Duplicate topic
  const handleDuplicateTopic = async (topic: TutorialTopic) => {
    if (!user) return;
    
    setSaving(true);
    const result = await createTopic(
      `${topic.title} (Cópia)`,
      topic.description,
      user.uid,
      topic.thumbnailUrl
    );
    
    if (result.success) {
      toast.success('Tópico duplicado! Agora adicione as aulas.');
    } else {
      toast.error('Erro ao duplicar');
    }
    setSaving(false);
  };

  // Admin stats
  const getAdminStats = () => {
    const publishedTopics = topics.filter(t => t.isPublished).length;
    const draftTopics = topics.filter(t => !t.isPublished).length;
    const totalLessonsInAllTopics = topics.reduce((sum, t) => sum + (t.lessonsCount || 0), 0);
    
    return {
      publishedTopics,
      draftTopics,
      totalLessonsInAllTopics,
      totalTopics: topics.length,
    };
  };

  const adminStats = getAdminStats();

  const getTopicProgress = (topicId: string) => {
    const lessons = lessonsMap[topicId] || [];
    if (lessons.length === 0) return 0;
    const completed = lessons.filter(l => completedLessons.has(l.id)).length;
    return Math.round((completed / lessons.length) * 100);
  };

  // Calculate overall stats
  const getOverallStats = () => {
    const allLessons = Object.values(lessonsMap).flat();
    const totalLessons = allLessons.length;
    const completedCount = allLessons.filter(l => completedLessons.has(l.id)).length;
    const overallProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    
    // Calculate estimated time remaining (assuming 10 min average per lesson)
    const remainingLessons = totalLessons - completedCount;
    const avgMinutesPerLesson = 10;
    const totalMinutesRemaining = remainingLessons * avgMinutesPerLesson;
    
    let timeRemaining: string;
    if (totalMinutesRemaining === 0) {
      timeRemaining = 'Concluído!';
    } else if (totalMinutesRemaining < 60) {
      timeRemaining = `${totalMinutesRemaining} min`;
    } else {
      const hours = Math.floor(totalMinutesRemaining / 60);
      const mins = totalMinutesRemaining % 60;
      timeRemaining = mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    
    return {
      totalLessons,
      completedCount,
      overallProgress,
      timeRemaining,
      topicsCompleted: topics.filter(t => getTopicProgress(t.id) === 100).length,
      totalTopics: topics.length,
    };
  };

  const stats = getOverallStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#F5A623]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        
        <main className="p-6">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 mb-3">
                <span className="text-xs text-[#F5A623] uppercase tracking-widest font-medium">Educação</span>
              </div>
              <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                <GraduationCap className="h-8 w-8 text-[#F5A623]" />
                <span className="text-[#F5A623] italic">Tutoriais</span>
              </h1>
              <p className="mt-1 text-white/50">
                Aprenda com nossos cursos em vídeo organizados por tópicos
              </p>
            </div>
            
            {hasAdminAccess && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAdminPanel(true)} 
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Painel Admin
                </Button>
                <Button onClick={() => openTopicDialog()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Tópico
                </Button>
              </div>
            )}
          </div>

          {/* Progress Summary Card */}
          {stats.totalLessons > 0 && (
            <Card variant="gradient" className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
                  {/* Overall Progress */}
                  <div className="p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-[#F5A623]/20 flex items-center justify-center">
                        <Target className="h-5 w-5 text-[#F5A623]" />
                      </div>
                      <div>
                        <p className="text-xs text-white/50 uppercase tracking-wider">Progresso Geral</p>
                        <p className="text-2xl font-bold text-white">{stats.overallProgress}%</p>
                      </div>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div 
                        className={cn(
                          "h-full transition-all duration-700",
                          stats.overallProgress === 100 
                            ? "bg-gradient-to-r from-green-500 to-green-400" 
                            : "bg-gradient-to-r from-[#F5A623] to-[#E8920D]"
                        )}
                        style={{ width: `${stats.overallProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Completed Lessons */}
                  <div className="p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-white/50 uppercase tracking-wider">Aulas Concluídas</p>
                        <p className="text-2xl font-bold text-white">
                          {stats.completedCount}
                          <span className="text-sm font-normal text-white/50">/{stats.totalLessons}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Topics Completed */}
                  <div className="p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-white/50 uppercase tracking-wider">Tópicos Completos</p>
                        <p className="text-2xl font-bold text-white">
                          {stats.topicsCompleted}
                          <span className="text-sm font-normal text-white/50">/{stats.totalTopics}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Time Remaining */}
                  <div className="p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Timer className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-white/50 uppercase tracking-wider">Tempo Restante</p>
                        <p className={cn(
                          "text-2xl font-bold",
                          stats.overallProgress === 100 ? "text-green-400" : "text-white"
                        )}>
                          {stats.timeRemaining}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Topics List */}
            <div className="lg:col-span-1">
              <Card variant="gradient" className="sticky top-6">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-white/10">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#F5A623]" />
                      Tópicos do Curso
                    </h2>
                    <p className="text-xs text-white/50 mt-1">
                      {topics.length} tópico{topics.length !== 1 ? 's' : ''} disponíve{topics.length !== 1 ? 'is' : 'l'}
                    </p>
                  </div>
                  
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="p-2">
                      {topics.length === 0 ? (
                        <div className="text-center py-8 text-white/50">
                          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Nenhum tópico disponível</p>
                          {hasAdminAccess && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-3"
                              onClick={() => openTopicDialog()}
                            >
                              Criar primeiro tópico
                            </Button>
                          )}
                        </div>
                      ) : (
                        topics.map((topic) => {
                          const isExpanded = expandedTopics.has(topic.id);
                          const lessons = lessonsMap[topic.id] || [];
                          const progress = getTopicProgress(topic.id);
                          
                          return (
                            <Collapsible
                              key={topic.id}
                              open={isExpanded}
                              onOpenChange={() => toggleTopic(topic.id)}
                            >
                              <div className="mb-2">
                                <CollapsibleTrigger className="w-full">
                                  <div className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg transition-all text-left w-full",
                                    "hover:bg-white/5",
                                    currentTopic?.id === topic.id && "bg-[#F5A623]/10 border border-[#F5A623]/20"
                                  )}>
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-[#F5A623] shrink-0" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-white/50 shrink-0" />
                                    )}
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-white truncate">
                                          {topic.title}
                                        </span>
                                        {!topic.isPublished && hasAdminAccess && (
                                          <Badge variant="outline" className="text-xs shrink-0">
                                            Rascunho
                                          </Badge>
                                        )}
                                      </div>
                                      {/* Progress bar */}
                                      <div className="mt-2 space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-white/50">
                                            {topic.lessonsCount} aula{topic.lessonsCount !== 1 ? 's' : ''}
                                          </span>
                                          <span className={cn(
                                            "text-xs font-medium",
                                            progress === 100 ? "text-green-400" : progress > 0 ? "text-[#F5A623]" : "text-white/40"
                                          )}>
                                            {progress}%
                                          </span>
                                        </div>
                                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                          <div 
                                            className={cn(
                                              "h-full transition-all duration-500",
                                              progress === 100 
                                                ? "bg-gradient-to-r from-green-500 to-green-400" 
                                                : "bg-gradient-to-r from-[#F5A623] to-[#E8920D]"
                                            )}
                                            style={{ width: `${progress}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {hasAdminAccess && (
                                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => openTopicDialog(topic)}
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-red-400 hover:text-red-300"
                                          onClick={() => handleDeleteTopic(topic.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </CollapsibleTrigger>
                                
                                <CollapsibleContent>
                                  <div className="ml-7 mt-1 space-y-1">
                                    {lessons.map((lesson, index) => (
                                      <div
                                        key={lesson.id}
                                        className={cn(
                                          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all",
                                          "hover:bg-white/5",
                                          currentLesson?.id === lesson.id && "bg-[#F5A623]/10"
                                        )}
                                        onClick={() => playLesson(lesson, topic)}
                                      >
                                        <div className={cn(
                                          "h-6 w-6 rounded-full flex items-center justify-center text-xs shrink-0",
                                          completedLessons.has(lesson.id)
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-white/10 text-white/70"
                                        )}>
                                          {completedLessons.has(lesson.id) ? (
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                          ) : (
                                            index + 1
                                          )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                          <p className={cn(
                                            "text-sm truncate",
                                            currentLesson?.id === lesson.id ? "text-[#F5A623]" : "text-white/80"
                                          )}>
                                            {lesson.title}
                                          </p>
                                          {lesson.duration && (
                                            <p className="text-[10px] text-white/40 flex items-center gap-1">
                                              <Clock className="h-2.5 w-2.5" />
                                              {lesson.duration}
                                            </p>
                                          )}
                                        </div>
                                        
                                        {hasAdminAccess && (
                                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={() => openLessonDialog(topic.id, lesson)}
                                            >
                                              <Edit2 className="h-2.5 w-2.5" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-red-400"
                                              onClick={() => handleDeleteLesson(lesson.id, topic.id)}
                                            >
                                              <Trash2 className="h-2.5 w-2.5" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    
                                    {hasAdminAccess && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs text-white/50 hover:text-white mt-2"
                                        onClick={() => openLessonDialog(topic.id)}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Adicionar aula
                                      </Button>
                                    )}
                                    
                                    {hasAdminAccess && (
                                      <Button
                                        variant={topic.isPublished ? "outline" : "default"}
                                        size="sm"
                                        className="w-full text-xs mt-2"
                                        onClick={() => handleTogglePublish(topic)}
                                      >
                                        {topic.isPublished ? 'Despublicar' : 'Publicar Tópico'}
                                      </Button>
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Video Player */}
            <div className="lg:col-span-2">
              {currentLesson ? (
                <div className="space-y-4">
                  {/* Video */}
                  <Card variant="gradient" className="overflow-hidden">
                    <div className="aspect-video bg-black">
                      <iframe
                        src={getYoutubeEmbedUrl(currentLesson.youtubeId)}
                        title={currentLesson.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </Card>
                  
                  {/* Lesson Info */}
                  <Card variant="gradient">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-[#F5A623]/20 text-[#F5A623]">
                              {currentTopic?.title}
                            </Badge>
                            {currentLesson.duration && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {currentLesson.duration}
                              </Badge>
                            )}
                          </div>
                          <h2 className="text-xl font-bold text-white mb-2">
                            {currentLesson.title}
                          </h2>
                          {currentLesson.description && (
                            <p className="text-white/60">
                              {currentLesson.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(currentLesson.youtubeUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            YouTube
                          </Button>
                          <Button
                            variant={completedLessons.has(currentLesson.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => markAsCompleted(currentLesson.id)}
                            className={completedLessons.has(currentLesson.id) ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {completedLessons.has(currentLesson.id) ? 'Concluída' : 'Marcar concluída'}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Navigation */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                        <Button
                          variant="ghost"
                          onClick={goToPrevLesson}
                          disabled={!currentTopic || (lessonsMap[currentTopic.id] || []).findIndex(l => l.id === currentLesson.id) === 0}
                        >
                          ← Aula anterior
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={goToNextLesson}
                          disabled={!currentTopic || (lessonsMap[currentTopic.id] || []).findIndex(l => l.id === currentLesson.id) === (lessonsMap[currentTopic.id] || []).length - 1}
                        >
                          Próxima aula →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card variant="gradient" className="h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <Video className="h-16 w-16 mx-auto mb-4 text-white/20" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Selecione uma aula
                    </h3>
                    <p className="text-white/50 max-w-md">
                      Escolha um tópico na lista à esquerda e clique em uma aula para começar a assistir.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Topic Dialog */}
      <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTopic ? 'Editar Tópico' : 'Novo Tópico'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">Título *</label>
              <Input
                value={topicForm.title}
                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                placeholder="Ex: Introdução ao CapCut"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">Descrição</label>
              <Textarea
                value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                placeholder="Breve descrição do tópico..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">URL da Thumbnail (opcional)</label>
              <Input
                value={topicForm.thumbnailUrl}
                onChange={(e) => setTopicForm({ ...topicForm, thumbnailUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTopicDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTopic} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTopic ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Editar Aula' : 'Nova Aula'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">Título *</label>
              <Input
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                placeholder="Ex: Como criar seu primeiro projeto"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">URL do YouTube *</label>
              <Input
                value={lessonForm.youtubeUrl}
                onChange={(e) => setLessonForm({ ...lessonForm, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
              {lessonForm.youtubeUrl && extractYoutubeId(lessonForm.youtubeUrl) && (
                <div className="mt-2">
                  <img
                    src={getYoutubeThumbnail(extractYoutubeId(lessonForm.youtubeUrl)!, 'medium')}
                    alt="Preview"
                    className="rounded-md max-h-24"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">Descrição</label>
              <Textarea
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                placeholder="O que será ensinado nesta aula..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">Duração (opcional)</label>
              <Input
                value={lessonForm.duration}
                onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                placeholder="Ex: 15:30"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLessonDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLesson} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingLesson ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Panel Dialog */}
      <Dialog open={showAdminPanel} onOpenChange={setShowAdminPanel}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#F5A623]" />
              Painel de Administração - Tutoriais
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Admin Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-[#F5A623]/10 border-[#F5A623]/20">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-[#F5A623]" />
                  <p className="text-2xl font-bold text-white">{adminStats.totalTopics}</p>
                  <p className="text-xs text-white/50">Total Tópicos</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-4 text-center">
                  <Eye className="h-6 w-6 mx-auto mb-2 text-green-400" />
                  <p className="text-2xl font-bold text-white">{adminStats.publishedTopics}</p>
                  <p className="text-xs text-white/50">Publicados</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardContent className="p-4 text-center">
                  <EyeOff className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                  <p className="text-2xl font-bold text-white">{adminStats.draftTopics}</p>
                  <p className="text-xs text-white/50">Rascunhos</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-500/10 border-purple-500/20">
                <CardContent className="p-4 text-center">
                  <Video className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                  <p className="text-2xl font-bold text-white">{adminStats.totalLessonsInAllTopics}</p>
                  <p className="text-xs text-white/50">Total Aulas</p>
                </CardContent>
              </Card>
            </div>

            {/* Topics Management */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#F5A623]" />
                Gerenciar Tópicos
              </h3>
              
              <div className="space-y-2">
                {topics.length === 0 ? (
                  <p className="text-white/50 text-center py-4">Nenhum tópico criado ainda</p>
                ) : (
                  topics.map((topic, index) => (
                    <div 
                      key={topic.id} 
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        topic.isPublished 
                          ? "bg-green-500/5 border-green-500/20" 
                          : "bg-yellow-500/5 border-yellow-500/20"
                      )}
                    >
                      {/* Order controls */}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === 0 || reordering}
                          onClick={() => handleMoveTopicUp(topic, index)}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index >= topics.length - 1 || reordering}
                          onClick={() => handleMoveTopicDown(topic, index)}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Topic info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white truncate">{topic.title}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px]",
                              topic.isPublished 
                                ? "text-green-400 border-green-400/30" 
                                : "text-yellow-400 border-yellow-400/30"
                            )}
                          >
                            {topic.isPublished ? 'Publicado' : 'Rascunho'}
                          </Badge>
                        </div>
                        <p className="text-xs text-white/50">
                          {topic.lessonsCount} aula{topic.lessonsCount !== 1 ? 's' : ''} • Ordem: {topic.order + 1}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleTogglePublish(topic)}
                          title={topic.isPublished ? 'Despublicar' : 'Publicar'}
                        >
                          {topic.isPublished ? (
                            <EyeOff className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-green-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDuplicateTopic(topic)}
                          title="Duplicar tópico"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setShowAdminPanel(false);
                            openTopicDialog(topic);
                          }}
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteTopic(topic.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-[#F5A623]" />
                Ações Rápidas
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => {
                    setShowAdminPanel(false);
                    openTopicDialog();
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Criar Novo Tópico
                </Button>
                
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={async () => {
                    // Publish all drafts
                    const drafts = topics.filter(t => !t.isPublished);
                    if (drafts.length === 0) {
                      toast.info('Nenhum rascunho para publicar');
                      return;
                    }
                    
                    for (const topic of drafts) {
                      await updateTopic(topic.id, { isPublished: true });
                    }
                    
                    toast.success(`${drafts.length} tópico(s) publicado(s)!`);
                  }}
                >
                  <Eye className="h-4 w-4" />
                  Publicar Todos Rascunhos
                </Button>
              </div>
            </div>

            {/* XP Info */}
            <div className="p-4 rounded-lg bg-[#F5A623]/10 border border-[#F5A623]/20">
              <h4 className="font-medium text-[#F5A623] mb-2 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Sistema de XP - Tutoriais
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/70">Por aula concluída:</p>
                  <p className="font-bold text-white">+{TUTORIAL_XP_REWARDS.COMPLETE_LESSON} XP, +{TUTORIAL_XP_REWARDS.POINTS_PER_LESSON} pts</p>
                </div>
                <div>
                  <p className="text-white/70">Por tópico completo:</p>
                  <p className="font-bold text-white">+{TUTORIAL_XP_REWARDS.COMPLETE_TOPIC} XP bônus, +{TUTORIAL_XP_REWARDS.POINTS_PER_TOPIC} pts</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminPanel(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tutorials;
