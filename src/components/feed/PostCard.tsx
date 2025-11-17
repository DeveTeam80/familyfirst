"use client";

import * as React from "react";
import {
  Paper,
  Box,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Divider,
  Stack,
  Button,
  useTheme,
  alpha,
  useMediaQuery,
} from "@mui/material";
import {
  MoreVert,
  Edit,
  Delete,
  Comment as CommentIcon,
  Share as ShareIcon,
  FavoriteBorder,
  Favorite,
} from "@mui/icons-material";

export type Comment = { id: string; user: string; text: string };

export type PostCardData = {
  id: string;
  user: string;
  avatar?: string;
  content?: string;
  image?: string | null;
  tags: string[];
  date: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  eventDate?: string;
};

type Props = {
  post: PostCardData;
  onLike: (postId: string) => void;
  onCommentClick: (postId: string) => void;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
  onShare: (postId: string) => void;
  currentUserName: string;
  canEdit?: boolean;
};

export default function PostCard({
  post,
  onLike,
  onCommentClick,
  onEdit,
  onDelete,
  onShare,
  currentUserName,
  canEdit = true,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  
  const isLiked = post.likedBy.includes(currentUserName);
  const isOwnPost = post.user === currentUserName;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };
  
  const handleMenuClose = () => setMenuAnchor(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <Paper
      elevation={0}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      sx={{
        p: isMobile ? 2 : 3,
        mb: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          opacity: 0,
          transition: 'opacity 0.3s',
        },
        ...(!isMobile && {
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            transform: 'translateY(-2px)',
            borderColor: alpha(theme.palette.primary.main, 0.3),
            '&::before': {
              opacity: 1,
            },
          },
        }),
      }}
    >
      {/* Header Section */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar 
            src={post.avatar} 
            alt={post.user}
            sx={{
              width: isMobile ? 40 : 48,
              height: isMobile ? 40 : 48,
              border: '2px solid',
              borderColor: 'divider',
            }}
          />
          <Box>
            <Typography variant={isMobile ? "body2" : "subtitle1"} sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              {post.user}
            </Typography>
            {post.date && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(post.date)}
                </Typography>
                {isOwnPost && (
                  <Chip label="You" size="small" sx={{ height: 16, fontSize: '0.65rem', fontWeight: 500 }} />
                )}
              </Box>
            )}
          </Box>
        </Box>

        {canEdit && isOwnPost && (
          <IconButton
            aria-label="post options"
            onClick={handleMenuOpen}
            size="small"
            sx={{
              opacity: isMobile ? 1 : (isHovered ? 1 : 0.6),
            }}
          >
            <MoreVert />
          </IconButton>
        )}
      </Box>

      {/* Post Options Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => { handleMenuClose(); onEdit(post.id); }}>
          <Edit fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} />
          <Typography variant="body2">Edit</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => { handleMenuClose(); onDelete(post.id); }}>
          <Delete fontSize="small" sx={{ mr: 1.5, color: 'error.main' }} />
          <Typography variant="body2" color="error">Delete</Typography>
        </MenuItem>
      </Menu>

      {/* Content Section */}
      {post.content && (
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 2, 
            lineHeight: 1.6, 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
          }}
        >
          {post.content}
        </Typography>
      )}

      {post.image && (
        <Box 
          sx={{ 
            mt: 2, 
            mb: 2, 
            borderRadius: 2, 
            overflow: 'hidden', 
            backgroundColor: 'background.default',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={post.image} 
            alt="Post" 
            style={{ 
              width: "100%", 
              maxHeight: isMobile ? '300px' : '500px', 
              objectFit: "cover", 
              display: 'block' 
            }} 
          />
        </Box>
      )}

      {post.eventDate && (
        <Box 
          sx={{ 
            mt: 2, 
            p: isMobile ? 1 : 1.5, 
            borderRadius: 2, 
            backgroundColor: alpha(theme.palette.primary.main, 0.08), 
            border: '1px solid', 
            borderColor: alpha(theme.palette.primary.main, 0.2), 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1 
          }}
        >
          <Typography variant="body2" sx={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>📅</Typography>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Event Date
            </Typography>
            <Typography 
              variant={isMobile ? "caption" : "body2"} 
              fontWeight={600} 
              color="primary"
            >
              {new Date(post.eventDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric',
              })}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <Stack direction="row" spacing={0.5} mt={2} flexWrap="wrap" useFlexGap>
          {post.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                borderRadius: 2,
                fontWeight: 500,
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                height: isMobile ? 24 : 'auto',
                backgroundColor: tag === 'Event' 
                  ? alpha(theme.palette.primary.main, 0.1) 
                  : alpha(theme.palette.grey[500], 0.1),
                color: tag === 'Event' ? 'primary.main' : 'text.secondary',
                border: '1px solid',
                borderColor: tag === 'Event' 
                  ? alpha(theme.palette.primary.main, 0.3) 
                  : 'transparent',
              }}
            />
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Stats Row */}
      {(post.likes > 0 || post.comments.length > 0) && (
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={1.5} 
          px={isMobile ? 0 : 1}
        >
          {post.likes > 0 && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box 
                sx={{ 
                  width: isMobile ? 18 : 20, 
                  height: isMobile ? 18 : 20, 
                  borderRadius: '50%', 
                  backgroundColor: 'error.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <Favorite sx={{ fontSize: isMobile ? 10 : 12, color: 'white' }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {post.likes} {post.likes === 1 ? 'like' : 'likes'}
              </Typography>
            </Box>
          )}

          {post.comments.length > 0 && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                cursor: 'pointer', 
                '&:hover': { 
                  color: 'primary.main', 
                  textDecoration: 'underline' 
                } 
              }} 
              onClick={() => onCommentClick(post.id)}
            >
              {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
            </Typography>
          )}
        </Box>
      )}

      {/* Action Buttons */}
      <Stack direction="row" spacing={isMobile ? 0.5 : 1}>
        <Button
          fullWidth
          size={isMobile ? "small" : "medium"}
          variant="text"
          startIcon={isLiked ? <Favorite fontSize={isMobile ? "small" : "medium"} /> : <FavoriteBorder fontSize={isMobile ? "small" : "medium"} />}
          onClick={() => onLike(post.id)}
          sx={{
            py: isMobile ? 0.75 : 1,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            transition: 'all 0.2s',
            color: isLiked ? 'error.main !important' : 'text.secondary !important',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: isLiked 
                ? alpha(theme.palette.error.main, 0.08)
                : alpha(theme.palette.action.hover, 0.8),
              color: isLiked ? 'error.dark !important' : 'primary.main !important',
              transform: 'scale(1.02)',
            },
          }}
        >
          {isMobile ? '' : 'Like'}
        </Button>

        <Button
          fullWidth
          size={isMobile ? "small" : "medium"}
          variant="text"
          startIcon={<CommentIcon fontSize={isMobile ? "small" : "medium"} />}
          onClick={() => onCommentClick(post.id)}
          sx={{
            py: isMobile ? 0.75 : 1,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            color: 'text.secondary !important',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.hover, 0.8),
              color: 'primary.main !important',
            },
          }}
        >
          {isMobile ? '' : 'Comment'}
        </Button>

        <Button
          fullWidth
          size={isMobile ? "small" : "medium"}
          variant="text"
          startIcon={<ShareIcon fontSize={isMobile ? "small" : "medium"} />}
          onClick={() => onShare(post.id)}
          sx={{
            py: isMobile ? 0.75 : 1,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            color: 'text.secondary !important',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.hover, 0.8),
              color: 'primary.main !important',
            },
          }}
        >
          {isMobile ? '' : 'Share'}
        </Button>
      </Stack>
    </Paper>
  );
}