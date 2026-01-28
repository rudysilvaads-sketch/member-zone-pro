import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  increment,
  arrayUnion,
  arrayRemove,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper to update user XP and points
const updateUserXpAndPoints = async (userId: string, xpAmount: number, pointsAmount: number): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      xp: increment(xpAmount),
      points: increment(pointsAmount),
    });
  } catch (error) {
    console.error('Error updating user xp and points:', error);
  }
};

export type ToolCategory = 'prompt' | 'code' | 'tool' | 'tutorial';
export type ToolStatus = 'pending' | 'approved' | 'rejected';

export interface Tool {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  userLevel: number;
  userRank: string;
  title: string;
  description: string;
  content: string;
  category: ToolCategory;
  tags: string[];
  likes: string[];
  saves: string[];
  views: number;
  status: ToolStatus;
  rejectionReason?: string;
  moderatedBy?: string;
  moderatedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ToolComment {
  id: string;
  toolId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  createdAt: Timestamp;
}

// XP rewards for tool actions
const XP_REWARDS = {
  CREATE_TOOL: 50,
  RECEIVE_LIKE: 5,
  RECEIVE_SAVE: 10,
};

// Create a new tool/resource
export const createTool = async (
  userId: string,
  userName: string,
  userAvatar: string | null,
  userLevel: number,
  userRank: string,
  title: string,
  description: string,
  content: string,
  category: ToolCategory,
  tags: string[]
): Promise<{ success: boolean; toolId?: string; error?: string }> => {
  try {
    const toolsRef = collection(db, 'tools');
    
    const toolData = {
      userId,
      userName,
      userAvatar,
      userLevel,
      userRank,
      title: title.trim(),
      description: description.trim(),
      content: content.trim(),
      category,
      tags: tags.map(t => t.toLowerCase().trim()),
      likes: [],
      saves: [],
      views: 0,
      status: 'pending' as ToolStatus, // Needs approval
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(toolsRef, toolData);
    
    // XP will be awarded after approval
    
    return { success: true, toolId: docRef.id };
  } catch (error) {
    console.error('Error creating tool:', error);
    return { success: false, error: 'Erro ao criar recurso' };
  }
};

// Subscribe to approved tools only (for public view)
export const subscribeToTools = (
  callback: (tools: Tool[]) => void,
  category?: ToolCategory,
  limitCount: number = 50
) => {
  const toolsRef = collection(db, 'tools');
  
  // Use simple query first to avoid index requirement issues
  // Filter by status and optionally by category client-side if index is missing
  const q = query(
    toolsRef, 
    orderBy('createdAt', 'desc'), 
    limit(limitCount * 2) // Fetch more to account for filtering
  );
  
  return onSnapshot(q, (snapshot) => {
    let tools = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Tool[];
    
    // Filter approved tools client-side
    tools = tools.filter(tool => tool.status === 'approved');
    
    // Filter by category if specified
    if (category) {
      tools = tools.filter(tool => tool.category === category);
    }
    
    // Limit to requested count
    tools = tools.slice(0, limitCount);
    
    callback(tools);
  }, (error) => {
    console.error('Error subscribing to tools:', error);
    callback([]);
  });
};

// Subscribe to all tools (for admin/moderator view)
export const subscribeToAllTools = (
  callback: (tools: Tool[]) => void,
  status?: ToolStatus,
  limitCount: number = 100
) => {
  const toolsRef = collection(db, 'tools');
  let q;
  
  if (status) {
    q = query(
      toolsRef, 
      where('status', '==', status),
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
  } else {
    q = query(toolsRef, orderBy('createdAt', 'desc'), limit(limitCount));
  }
  
  return onSnapshot(q, (snapshot) => {
    const tools = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Tool[];
    callback(tools);
  });
};

// Get tools (non-realtime)
export const getTools = async (
  category?: ToolCategory,
  limitCount: number = 50
): Promise<Tool[]> => {
  const toolsRef = collection(db, 'tools');
  let q;
  
  if (category) {
    q = query(
      toolsRef, 
      where('category', '==', category),
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
  } else {
    q = query(toolsRef, orderBy('createdAt', 'desc'), limit(limitCount));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Tool, 'id'>),
  })) as Tool[];
};

// Toggle like on a tool
export const toggleLikeTool = async (
  toolId: string,
  odId: string,
  toolOwnerId: string
): Promise<boolean> => {
  try {
    const toolRef = doc(db, 'tools', toolId);
    const toolDoc = await getDocs(query(collection(db, 'tools'), where('__name__', '==', toolId)));
    
    if (toolDoc.empty) return false;
    
    const toolData = toolDoc.docs[0].data();
    const likes = toolData.likes || [];
    const hasLiked = likes.includes(odId);
    
    if (hasLiked) {
      await updateDoc(toolRef, {
        likes: arrayRemove(odId)
      });
    } else {
      await updateDoc(toolRef, {
        likes: arrayUnion(odId)
      });
      
      // Award XP to tool owner for receiving a like
      if (toolOwnerId !== odId) {
        await updateUserXpAndPoints(toolOwnerId, XP_REWARDS.RECEIVE_LIKE, 1);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error toggling like:', error);
    return false;
  }
};

// Toggle save on a tool
export const toggleSaveTool = async (
  toolId: string,
  odId: string,
  toolOwnerId: string
): Promise<boolean> => {
  try {
    const toolRef = doc(db, 'tools', toolId);
    const toolDoc = await getDocs(query(collection(db, 'tools'), where('__name__', '==', toolId)));
    
    if (toolDoc.empty) return false;
    
    const toolData = toolDoc.docs[0].data();
    const saves = toolData.saves || [];
    const hasSaved = saves.includes(odId);
    
    if (hasSaved) {
      await updateDoc(toolRef, {
        saves: arrayRemove(odId)
      });
    } else {
      await updateDoc(toolRef, {
        saves: arrayUnion(odId)
      });
      
      // Award XP to tool owner for receiving a save
      if (toolOwnerId !== odId) {
        await updateUserXpAndPoints(toolOwnerId, XP_REWARDS.RECEIVE_SAVE, 2);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error toggling save:', error);
    return false;
  }
};

// Increment view count
export const incrementToolViews = async (toolId: string): Promise<void> => {
  try {
    const toolRef = doc(db, 'tools', toolId);
    await updateDoc(toolRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing views:', error);
  }
};

// Delete a tool (owner or admin only)
export const deleteTool = async (toolId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'tools', toolId));
    return true;
  } catch (error) {
    console.error('Error deleting tool:', error);
    return false;
  }
};

// Approve a tool (admin/moderator only)
export const approveTool = async (
  toolId: string,
  moderatorId: string
): Promise<boolean> => {
  try {
    const toolRef = doc(db, 'tools', toolId);
    const toolDoc = await getDoc(toolRef);
    
    if (!toolDoc.exists()) return false;
    
    const toolData = toolDoc.data();
    
    await updateDoc(toolRef, {
      status: 'approved',
      moderatedBy: moderatorId,
      moderatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Award XP to the tool creator after approval
    await updateUserXpAndPoints(toolData.userId, XP_REWARDS.CREATE_TOOL, 10);
    
    // Create notification for the user
    try {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        userId: toolData.userId,
        type: 'tool_approved',
        title: 'Recurso Aprovado! 🎉',
        message: `Seu recurso "${toolData.title}" foi aprovado e agora está visível para a comunidade! +50 XP`,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
    
    return true;
  } catch (error) {
    console.error('Error approving tool:', error);
    return false;
  }
};

// Reject a tool (admin/moderator only)
export const rejectTool = async (
  toolId: string,
  moderatorId: string,
  reason: string
): Promise<boolean> => {
  try {
    const toolRef = doc(db, 'tools', toolId);
    const toolDoc = await getDoc(toolRef);
    
    if (!toolDoc.exists()) return false;
    
    const toolData = toolDoc.data();
    
    await updateDoc(toolRef, {
      status: 'rejected',
      rejectionReason: reason,
      moderatedBy: moderatorId,
      moderatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Create notification for the user
    try {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        userId: toolData.userId,
        type: 'tool_rejected',
        title: 'Recurso Não Aprovado',
        message: `Seu recurso "${toolData.title}" não foi aprovado. Motivo: ${reason}`,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
    
    return true;
  } catch (error) {
    console.error('Error rejecting tool:', error);
    return false;
  }
};

// Update tool content (admin only)
export const updateToolContent = async (
  toolId: string,
  updates: {
    title?: string;
    description?: string;
    content?: string;
    category?: ToolCategory;
    tags?: string[];
  }
): Promise<boolean> => {
  try {
    const toolRef = doc(db, 'tools', toolId);
    await updateDoc(toolRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error updating tool:', error);
    return false;
  }
};

// Get category label
export const getCategoryLabel = (category: ToolCategory): string => {
  const labels: Record<ToolCategory, string> = {
    prompt: 'Prompt',
    code: 'Código',
    tool: 'Ferramenta',
    tutorial: 'Tutorial',
  };
  return labels[category] || category;
};

// Get category color
export const getCategoryColor = (category: ToolCategory): string => {
  const colors: Record<ToolCategory, string> = {
    prompt: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    code: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    tool: 'bg-green-500/20 text-green-400 border-green-500/30',
    tutorial: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  return colors[category] || 'bg-muted text-muted-foreground';
};

// Get status label
export const getStatusLabel = (status: ToolStatus): string => {
  const labels: Record<ToolStatus, string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
  };
  return labels[status] || status;
};

// Get status color
export const getStatusColor = (status: ToolStatus): string => {
  const colors: Record<ToolStatus, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
};
