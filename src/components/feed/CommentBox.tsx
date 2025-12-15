"use client";
import * as React from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  InputBase,
  Button,
  Collapse,
  alpha,
  useTheme,
  Fade,
  Skeleton,
} from "@mui/material";
import {
  MoreHoriz,
  Edit,
  Delete,
  // FavoriteBorder,
  Favorite,
  Send as SendIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

// -----------------------
// Types
// -----------------------
export type Comment = {
  id: string;
  user: string;
  userId?: string;
  avatar?: string;
  text: string;
  likes?: number;
  likedBy?: string[];
  replies?: Comment[];
  createdAt?: string;
};

type Props = {
  openForPostId: string | null;
  postId: string;
  comments: Comment[];
  value: string;
  setValue: (v: string) => void;
  onSubmit: () => void;
  currentUserId?: string;  
  currentUserAvatar?: string;
  onLikeComment?: (commentId: string) => void;
  onEditComment?: (commentId: string, newText: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onReplyComment?: (commentId: string, text: string) => void;
  isLoading?: boolean;
};

// -----------------------
// Helper: Format Date
// -----------------------
const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// -----------------------
// 💀 Loading Skeleton
// -----------------------
function CommentSkeleton({ isReply = false }: { isReply?: boolean }) {
  const theme = useTheme();
  const avatarSize = isReply ? 24 : 36;
  
  return (
    <Box sx={{ position: 'relative', mb: isReply ? 1.5 : 2.5, pl: isReply ? 6 : 0 }}>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Skeleton 
          variant="circular" 
          width={avatarSize} 
          height={avatarSize}
          sx={{ flexShrink: 0 }}
        />
        <Box sx={{ flex: 1 }}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.primary.main, 0.08) 
                : "#f2f4f7",
              borderRadius: '18px',
              borderTopLeftRadius: 4,
              px: 2,
              py: 1.5,
            }}
          >
            <Skeleton width="30%" height={16} sx={{ mb: 0.5 }} />
            <Skeleton width="90%" height={14} />
            <Skeleton width="70%" height={14} />
          </Paper>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5, ml: 0.5 }}>
            <Skeleton width={40} height={12} />
            <Skeleton width={30} height={12} />
            <Skeleton width={35} height={12} />
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

// -----------------------
// 💬 Single Comment Item
// -----------------------
function CommentItem({
  comment,
  currentUserId,
  currentUserAvatar,
  onLike,
  onEdit,
  onDelete,
  onReply,
  depth = 0,
  isLast = false,
}: {
  comment: Comment;
  currentUserId?: string;
  currentUserAvatar?: string;
  onLike?: (id: string) => void;
  onEdit?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
  onReply?: (id: string, text: string) => void;
  depth?: number;
  isLast?: boolean;
}) {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(comment.text);
  const [showReplyBox, setShowReplyBox] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");

  const isOwn = comment.user === currentUserId;
  const isLiked = comment.likedBy?.some(id => 
    id === currentUserId || id === comment.user
  ) || false;
  const likeCount = comment.likes || 0;
  const isReply = depth > 0;

  // 🎨 Colors - More distinct for replies
  const bubbleBg = theme.palette.mode === 'dark' 
    ? alpha(theme.palette.primary.main, isReply ? 0.05 : 0.1) 
    : isReply ? "#fafbfc" : "#f2f4f7";
  
  const threadColor = theme.palette.mode === 'dark'
    ? 'rgba(255,255,255,0.12)'
    : 'rgba(0,0,0,0.1)';

  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(comment.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleSubmitReply = () => {
    if (replyText.trim() && onReply) {
      onReply(comment.id, replyText.trim());
      setReplyText("");
      setShowReplyBox(false);
    }
  };

  // Significantly smaller avatar for replies
  const avatarSize = isReply ? 24 : 36;

  return (
    <Box sx={{ position: 'relative', mb: isReply ? 1.5 : 2.5 }}>
      
      {/* 🧵 Thread Lines for Nested Comments */}
      {isReply && (
        <>
          {/* Vertical line from top */}
          <Box
            sx={{
              position: 'absolute',
              left: -28,
              top: 0,
              height: isLast ? 20 : '100%',
              width: '2px',
              bgcolor: threadColor,
              zIndex: 0,
            }}
          />
          
          {/* Horizontal connector └── */}
          <Box
            sx={{
              position: 'absolute',
              left: -28,
              top: 20,
              width: '28px',
              height: '2px',
              bgcolor: threadColor,
              zIndex: 0,
            }}
          />
        </>
      )}

      {/* Main Content Row */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: isReply ? 1 : 1.5, 
          position: 'relative', 
          zIndex: 1,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Avatar - much smaller for replies */}
        <Avatar
          src={comment.avatar}
          sx={{
            width: avatarSize,
            height: avatarSize,
            fontSize: isReply ? '0.65rem' : '0.9rem',
            bgcolor: theme.palette.primary.light,
            border: isReply 
              ? `1.5px solid ${theme.palette.background.paper}` 
              : `2px solid ${theme.palette.background.paper}`,
            flexShrink: 0,
            boxShadow: isReply 
              ? 'none' 
              : `0 2px 4px ${alpha(theme.palette.common.black, 0.08)}`,
            opacity: isReply ? 0.9 : 1,
          }}
        >
          {comment.user[0]?.toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          
          {/* 💬 Comment Bubble */}
          {isEditing ? (
            <Box sx={{ width: '100%' }}>
              <Paper
                elevation={0}
                sx={{ 
                  p: 1.5, 
                  borderRadius: 3, 
                  border: `2px solid ${theme.palette.primary.main}`,
                  bgcolor: 'background.paper'
                }}
              >
                <InputBase
                  fullWidth 
                  multiline 
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus 
                  sx={{ fontSize: '0.9rem' }}
                />
              </Paper>
              <Stack direction="row" spacing={1} sx={{ mt: 1, justifyContent: 'flex-end' }}>
                <Button 
                  size="small" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(comment.text);
                  }} 
                  sx={{ color: 'text.secondary' }}
                >
                  Cancel
                </Button>
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={handleSaveEdit} 
                  sx={{ borderRadius: 4 }}
                >
                  Save
                </Button>
              </Stack>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box
                  sx={{
                    bgcolor: bubbleBg,
                    borderRadius: isReply ? '14px' : '18px',
                    borderTopLeftRadius: 4,
                    px: isReply ? 1.5 : 2, 
                    py: isReply ? 1 : 1.5,
                    maxWidth: '100%',
                    wordBreak: 'break-word',
                    border: isReply 
                      ? `1px solid ${alpha(theme.palette.divider, 0.08)}` 
                      : 'none',
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 700, 
                      fontSize: isReply ? '0.75rem' : '0.85rem', 
                      lineHeight: 1.2,
                      mb: 0.3,
                      opacity: isReply ? 0.85 : 1,
                    }}
                  >
                    {comment.user}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: isReply ? '0.8rem' : '0.9rem', 
                      color: 'text.primary', 
                      lineHeight: 1.5,
                      opacity: isReply ? 0.9 : 1,
                    }}
                  >
                    {comment.text}
                  </Typography>
                </Box>

                {isOwn && (
                  <IconButton
                    size="small"
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                    sx={{ 
                      opacity: isHovered || menuAnchor ? 1 : 0, 
                      transition: 'opacity 0.2s', 
                      color: 'text.secondary',
                      mt: 0.5,
                      '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.1) }
                    }}
                  >
                    <MoreHoriz fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {/* 🛠️ Action Bar */}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5, ml: 0.5 }}>
                <Typography 
                  variant="caption" 
                  color="text.disabled" 
                  sx={{ fontWeight: 500, fontSize: isReply ? '0.65rem' : '0.7rem' }}
                >
                  {formatDate(comment.createdAt)}
                </Typography>

                {/* ❤️ Like Action */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    cursor: 'pointer',
                  }}
                  onClick={() => onLike?.(comment.id)}
                >
                  <Typography 
                    variant="caption" 
                    fontWeight={700}
                    sx={{ 
                      color: isLiked ? 'error.main' : 'text.secondary',
                      fontSize: isReply ? '0.7rem' : '0.75rem',
                      '&:hover': { color: isLiked ? 'error.dark' : 'text.primary' }
                    }}
                  >
                    Like
                  </Typography>
                  {likeCount > 0 && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.3, 
                      bgcolor: isLiked ? 'error.main' : alpha(theme.palette.action.active, 0.08), 
                      borderRadius: '10px', 
                      px: 0.6, 
                      py: 0.2 
                    }}>
                      <Favorite sx={{ fontSize: '0.6rem', color: isLiked ? 'white' : 'text.secondary' }} />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.6rem', 
                          color: isLiked ? 'white' : 'text.secondary', 
                          fontWeight: 700, 
                          lineHeight: 1 
                        }}
                      >
                        {likeCount}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* ↩️ Reply Action */}
                {depth < 2 && ( // Limit nesting to 2 levels
                  <Typography 
                    variant="caption" 
                    fontWeight={700} 
                    color="text.secondary"
                    onClick={() => setShowReplyBox(!showReplyBox)}
                    sx={{ 
                      cursor: 'pointer', 
                      fontSize: isReply ? '0.7rem' : '0.75rem',
                      '&:hover': { color: 'text.primary' } 
                    }}
                  >
                    Reply
                  </Typography>
                )}
              </Stack>

              {/* 📝 Reply Input Field */}
              <Collapse in={showReplyBox}>
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Avatar 
                    src={currentUserAvatar} 
                    sx={{ width: 22, height: 22, flexShrink: 0 }} 
                  />
                  <Paper
                    elevation={0}
                    sx={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 5,
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      bgcolor: 'background.paper',
                      transition: 'all 0.2s',
                      '&:focus-within': { 
                        borderColor: 'primary.main',
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                      }
                    }}
                  >
                    <InputBase
                      fullWidth
                      placeholder={`Reply to ${comment.user}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      sx={{ fontSize: '0.8rem' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitReply();
                        }
                      }}
                    />
                    <IconButton 
                      size="small" 
                      onClick={handleSubmitReply} 
                      disabled={!replyText.trim()}
                      sx={{
                        color: replyText.trim() ? 'primary.main' : 'action.disabled'
                      }}
                    >
                      <SendIcon sx={{ fontSize: '0.95rem' }} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => setShowReplyBox(false)}
                      sx={{ color: 'text.secondary' }}
                    >
                      <CloseIcon sx={{ fontSize: '0.95rem' }} />
                    </IconButton>
                  </Paper>
                </Box>
              </Collapse>
            </>
          )}
        </Box>
      </Box>

      {/* 🔄 Recursion for Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ pl: 7, mt: 1.5 }}> {/* Increased padding */}
          {comment.replies.map((reply, index) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              currentUserAvatar={currentUserAvatar}
              onLike={onLike}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              depth={depth + 1}
              isLast={index === comment.replies!.length - 1}
            />
          ))}
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{ 
          elevation: 8, 
          sx: { 
            borderRadius: 2, 
            minWidth: 140,
            backdropFilter: 'blur(10px)',
          } 
        }}
      >
        <MenuItem 
          onClick={() => { 
            setMenuAnchor(null); 
            setIsEditing(true); 
          }} 
          sx={{ fontSize: '0.875rem', py: 1 }}
        >
          <Edit fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} /> 
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => { 
            setMenuAnchor(null); 
            onDelete?.(comment.id); 
          }} 
          sx={{ fontSize: '0.875rem', color: 'error.main', py: 1 }}
        >
          <Delete fontSize="small" sx={{ mr: 1.5 }} /> 
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}

// -----------------------
// 🚀 Main Comment Box
// -----------------------
export default function CommentBox({
  openForPostId,
  postId,
  comments,
  value,
  setValue,
  onSubmit,
  currentUserId,
  currentUserAvatar,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  onReplyComment,
  isLoading = false,
}: Props) {
  const theme = useTheme();

  if (openForPostId !== postId) return null;

  // Safety checks
  const safeComments = comments || [];
  const safeValue = value || "";

  return (
    <Fade in={openForPostId === postId}>
      <Box 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          bgcolor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.3)
            : alpha(theme.palette.action.hover, 0.2),
          borderRadius: 3,
          mb: 3,
        }}
      >
        
        {/* Main Input */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: safeComments.length > 0 || isLoading ? 3 : 0 }}>
          <Avatar 
            src={currentUserAvatar} 
            sx={{ 
              width: 36, 
              height: 36, 
              border: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
              flexShrink: 0,
            }}
          />
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.5,
              borderRadius: 6,
              border: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
              bgcolor: theme.palette.background.paper,
              transition: 'all 0.2s',
              '&:focus-within': {
                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                borderColor: 'primary.main'
              }
            }}
          >
            <InputBase
              sx={{ flex: 1, fontSize: '0.95rem', py: 0.5 }}
              placeholder="Add a comment..."
              value={safeValue}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && safeValue.trim()) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              multiline
              maxRows={4}
            />
            <IconButton
              onClick={onSubmit}
              disabled={!safeValue.trim()}
              size="small"
              sx={{ 
                bgcolor: safeValue.trim() ? 'primary.main' : 'transparent',
                color: safeValue.trim() ? 'white' : 'action.disabled',
                transition: 'all 0.2s',
                '&:hover': { 
                  bgcolor: safeValue.trim() ? 'primary.dark' : 'transparent' 
                },
                '&.Mui-disabled': {
                  bgcolor: 'transparent'
                }
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Paper>
        </Box>

        {/* Comments List or Loading Skeleton */}
        {isLoading ? (
          <Stack spacing={0}>
            <CommentSkeleton />
            <CommentSkeleton />
            <Box sx={{ pl: 7 }}>
              <CommentSkeleton isReply />
            </Box>
          </Stack>
        ) : safeComments.length > 0 ? (
          <Stack spacing={0}> 
            {safeComments.map((comment, index) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                currentUserAvatar={currentUserAvatar}
                onLike={onLikeComment}
                onEdit={onEditComment}
                onDelete={onDeleteComment}
                onReply={onReplyComment}
                depth={0}
                isLast={index === safeComments.length - 1}
              />
            ))}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3, opacity: 0.6 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}>
              No comments yet. Be the first to comment!
            </Typography>
          </Box>
        )}
      </Box>
    </Fade>
  );
}