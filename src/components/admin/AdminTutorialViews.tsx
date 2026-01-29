import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Eye, Users, CheckCircle2, ChevronDown, ChevronRight, 
  Video, Clock, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  TutorialView,
  subscribeToTutorialViews,
  getLessonViewStats,
  getOverallViewStats,
  LessonViewStats,
  ViewStats
} from '@/lib/tutorialViewsService';

const AdminTutorialViews = () => {
  const [views, setViews] = useState<TutorialView[]>([]);
  const [lessonStats, setLessonStats] = useState<LessonViewStats[]>([]);
  const [overallStats, setOverallStats] = useState<ViewStats>({
    totalViews: 0,
    uniqueViewers: 0,
    completions: 0,
  });
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToTutorialViews((viewsData) => {
      setViews(viewsData);
      setLessonStats(getLessonViewStats(viewsData));
      setOverallStats(getOverallViewStats(viewsData));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-[#F5A623] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto mb-2 text-blue-400" />
            <p className="text-2xl font-bold text-white">{overallStats.totalViews}</p>
            <p className="text-xs text-white/50">Total Visualizações</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-purple-400" />
            <p className="text-2xl font-bold text-white">{overallStats.uniqueViewers}</p>
            <p className="text-xs text-white/50">Usuários Únicos</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold text-white">{overallStats.completions}</p>
            <p className="text-xs text-white/50">Aulas Concluídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lesson Views List */}
      <div>
        <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
          <Video className="h-4 w-4 text-[#F5A623]" />
          Visualizações por Aula
        </h4>

        {lessonStats.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma visualização registrada ainda</p>
            <p className="text-xs mt-1">As visualizações aparecerão aqui quando os usuários assistirem às aulas</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {lessonStats.map((stat) => {
                const isExpanded = expandedLessons.has(stat.lessonId);
                
                return (
                  <Collapsible
                    key={stat.lessonId}
                    open={isExpanded}
                    onOpenChange={() => toggleLesson(stat.lessonId)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-all text-left w-full",
                        "hover:bg-white/5 border border-white/10",
                        isExpanded && "bg-white/5 border-[#F5A623]/30"
                      )}>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[#F5A623] shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-white/50 shrink-0" />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white text-sm truncate">
                              {stat.lessonTitle}
                            </span>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {stat.topicTitle}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {stat.views} visualização{stat.views !== 1 ? 'ões' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-400" />
                              {stat.completions} conclusão{stat.completions !== 1 ? 'ões' : ''}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex -space-x-2">
                          {stat.viewers.slice(0, 3).map((viewer, idx) => (
                            <Avatar key={idx} className="h-6 w-6 border-2 border-[#0a0a0a]">
                              <AvatarImage src={viewer.userAvatar} />
                              <AvatarFallback className="text-[10px] bg-[#F5A623]/20 text-[#F5A623]">
                                {viewer.userName?.charAt(0)?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {stat.viewers.length > 3 && (
                            <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/70 border-2 border-[#0a0a0a]">
                              +{stat.viewers.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="ml-7 mt-2 space-y-1">
                        {stat.viewers.map((viewer, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 rounded-md bg-white/5"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={viewer.userAvatar} />
                              <AvatarFallback className="text-xs bg-[#F5A623]/20 text-[#F5A623]">
                                {viewer.userName?.charAt(0)?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {viewer.userName}
                              </p>
                              <p className="text-xs text-white/40 truncate">
                                {viewer.userEmail}
                              </p>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-1 text-xs text-white/50">
                                <Clock className="h-3 w-3" />
                                {formatDate(viewer.viewedAt)}
                              </div>
                              {viewer.completed && (
                                <Badge className="mt-1 text-[10px] bg-green-500/20 text-green-400">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Concluído
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Recent Activity */}
      {views.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#F5A623]" />
            Atividade Recente
          </h4>
          
          <div className="space-y-2">
            {views.slice(0, 5).map((view) => (
              <div
                key={view.id}
                className="flex items-center gap-3 p-2 rounded-md bg-white/5"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={view.userAvatar} />
                  <AvatarFallback className="text-xs bg-[#F5A623]/20 text-[#F5A623]">
                    {view.userName?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <span className="font-medium">{view.userName}</span>
                    <span className="text-white/50"> assistiu </span>
                    <span className="font-medium text-[#F5A623]">{view.lessonTitle}</span>
                  </p>
                  <p className="text-xs text-white/40">{formatDate(view.viewedAt)}</p>
                </div>
                
                {view.completed && (
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTutorialViews;
