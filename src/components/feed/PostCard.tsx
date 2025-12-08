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
  Collapse,
  Tooltip,
  Badge,
  Zoom,
  AvatarGroup,
} from "@mui/material";
import {
  MoreVert,
  Edit,
  Delete,
  Comment as CommentIcon,
  Share as ShareIcon,
  FavoriteBorder,
  Favorite,
  BookmarkBorder,
  Bookmark,
  Public,
  VerifiedUser,
  Lock,
  Group,
} from "@mui/icons-material";

/* -----------------------
   Type Definitions
   ----------------------- */
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
  date?: string;
};

export type PostCardData = {
  id: string;
  userId: string;         // 🔥 Author's userId
  user: string;           // Display name
  username?: string;
  avatar?: string;
  content?: string;
  image?: string | null;
  images?: string[];
  tags: string[];
  date: string;
  likes: number;
  likedBy: string[];      // 🔥 Array of userIds
  comments: Comment[];
  eventDate?: string;
  createdAt?: string;
  visibility?: 'PUBLIC' | 'FAMILY' | 'PRIVATE'; 
};

type Props = {
  post: PostCardData;
  onLike: (postId: string) => void;
  onCommentClick: (postI: string) => void;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
  onShare: (postId: string) => void;
  onImageClick?: (index: number) => void;
  currentUserName: string;
  currentUserId: string;  // 🔥 Changed from currentUsername
  canEdit?: boolean;
  commentsOpen?: boolean;
  commentSection?: React.ReactNode;
};

/* -----------------------
   🎨 Premium Image Grid
   ----------------------- */
const PremiumImageGrid = ({ 
  images, 
  onImageClick 
}: { 
  images: string[];
  onImageClick?: (index: number) => void;
}) => {
  const theme = useTheme();
  const count = images.length;

  if (count === 0) return null;

  const handleImageClick = (index: number) => {
    if (onImageClick) {
      onImageClick(index);
    }
  };

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
    cursor: "pointer",
  };

  const hoverEffectSx = {
    overflow: 'hidden',
    position: 'relative',
    height: '100%',
    backgroundColor: alpha(theme.palette.common.black, 0.02),
    cursor: 'pointer',
    '&:hover img': { transform: 'scale(1.08)' },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: `linear-gradient(180deg, transparent 0%, ${alpha(theme.palette.common.black, 0)} 50%, ${alpha(theme.palette.common.black, 0.1)} 100%)`,
      opacity: 0,
      transition: 'opacity 0.3s',
      zIndex: 1,
      pointerEvents: 'none'
    },
    '&:hover::before': { opacity: 1 }
  };

  const containerStyle = {
    display: "grid",
    gap: "6px",
    width: "100%",
    height: count === 1 ? "auto" : "420px",
    borderRadius: "16px",
    overflow: "hidden",
    mt: 2,
    mb: 2,
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.04)}`,
  };

  if (count === 1) {
    return (
      <Box sx={containerStyle}>
        <Box sx={{ ...hoverEffectSx, maxHeight: '600px' }} onClick={() => handleImageClick(0)}>
          <img src={images[0]} alt="post-img-0" style={imgStyle} />
        </Box>
      </Box>
    );
  }

  if (count === 2) {
    return (
      <Box sx={{ ...containerStyle, gridTemplateColumns: "1fr 1fr" }}>
        {images.map((img, i) => (
          <Box key={i} sx={hoverEffectSx} onClick={() => handleImageClick(i)}>
            <img src={img} alt={`post-img-${i}`} style={imgStyle} />
          </Box>
        ))}
      </Box>
    );
  }

  if (count === 3) {
    return (
      <Box sx={{ ...containerStyle, gridTemplateColumns: "2fr 1fr", gridTemplateRows: "1fr 1fr" }}>
        <Box sx={{ ...hoverEffectSx, gridRow: "1 / span 2" }} onClick={() => handleImageClick(0)}>
          <img src={images[0]} alt="post-img-0" style={imgStyle} />
        </Box>
        <Box sx={hoverEffectSx} onClick={() => handleImageClick(1)}>
          <img src={images[1]} alt="post-img-1" style={imgStyle} />
        </Box>
        <Box sx={hoverEffectSx} onClick={() => handleImageClick(2)}>
          <img src={images[2]} alt="post-img-2" style={imgStyle} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ ...containerStyle, gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }}>
      {images.slice(0, 4).map((img, i) => {
        const isLast = i === 3;
        const remaining = count - 4;
        return (
          <Box key={i} sx={hoverEffectSx} onClick={() => handleImageClick(i)}>
            <img src={img} alt={`post-img-${i}`} style={imgStyle} />
            {isLast && remaining > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  bgcolor: alpha(theme.palette.common.black, 0.7),
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: 'all 0.3s',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.black, 0.6),
                    backdropFilter: "blur(10px)",
                  }
                }}
              >
                <Typography variant="h4" fontWeight="800" color="white" sx={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                  +{remaining + 1}
                </Typography>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

/* -----------------------
   💎 Main Component
   ----------------------- */
export default function PostCard({
  post,
  onLike,
  onCommentClick,
  onEdit,
  onDelete,
  onShare,
  onImageClick,
  currentUserName,
  currentUserId,  // 🔥 Changed from currentUsername
  canEdit = true,
  commentsOpen = false,
  commentSection,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [bookmarked, setBookmarked] = React.useState(false);
  const [likeAnimating, setLikeAnimating] = React.useState(false);

  // 🔥 Compare userId with likedBy array
  const isLiked = post.likedBy.includes(currentUserId);
  const isOwnPost = post.userId === currentUserId;

  const postImages = React.useMemo(() => {
    if (post.images && post.images.length > 0) return post.images;
    if (post.image) return [post.image];
    return [];
  }, [post.images, post.image]);

  const handleLikeClick = () => {
    setLikeAnimating(true);
    onLike(post.id);
    setTimeout(() => setLikeAnimating(false), 600);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getVisibilityConfig = () => {
    const mode = (post.visibility || 'FAMILY').toUpperCase();
    switch (mode) {
      case 'PUBLIC': return { icon: <Public sx={{ fontSize: 14 }} />, label: "Public", desc: "Visible to everyone" };
      case 'PRIVATE': return { icon: <Lock sx={{ fontSize: 14 }} />, label: "Private", desc: "Only visible to you" };
      case 'FAMILY': 
      default: return { icon: <Group sx={{ fontSize: 14 }} />, label: "Family", desc: "Visible to family members" };
    }
  };

  const visibilityConfig = getVisibilityConfig();
  const topLikers = post.likedBy.slice(0, 3);

  return (
    <Paper
      elevation={0}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      sx={{
        mb: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.6),
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
        position: 'relative',
        ...(!isMobile && {
          '&:hover': {
            boxShadow: `0 12px 40px -12px ${alpha(theme.palette.common.black, 0.1)}`,
            transform: 'translateY(-2px)',
            borderColor: alpha(theme.palette.primary.main, 0.3),
          },
        }),
      }}
    >
      <Box sx={{ height: 3, background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s' }} />

      <Box sx={{ p: isMobile ? 2 : 3, pb: 1 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={isOwnPost && <VerifiedUser sx={{ width: 16, height: 16, color: 'primary.main', bgcolor: 'background.paper', borderRadius: '50%' }} />}
            >
              <Avatar src={post.avatar} sx={{ width: 44, height: 44, border: `2px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                {post.user.charAt(0)}
              </Avatar>
            </Badge>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '0.95rem' }}>{post.user}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{formatDate(post.date)}</Typography>
                <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                <Tooltip title={visibilityConfig.desc} arrow>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', bgcolor: alpha(theme.palette.action.hover, 0.5), px: 0.8, py: 0.2, borderRadius: 1 }}>
                    {visibilityConfig.icon}
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>{visibilityConfig.label}</Typography>
                  </Box>
                </Tooltip>
              </Box>
            </Box>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <IconButton onClick={() => setBookmarked(!bookmarked)} size="small" sx={{ color: bookmarked ? 'warning.main' : 'text.secondary' }}>
              {bookmarked ? <Bookmark fontSize="small" /> : <BookmarkBorder fontSize="small" />}
            </IconButton>
            {canEdit && isOwnPost && <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small" sx={{ color: 'text.secondary' }}><MoreVert fontSize="small" /></IconButton>}
          </Stack>
        </Box>

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} PaperProps={{ elevation: 4, sx: { borderRadius: 2, minWidth: 140 } }}>
          <MenuItem onClick={() => { setMenuAnchor(null); onEdit(post.id); }} sx={{ fontSize: '0.9rem' }}><Edit fontSize="small" sx={{ mr: 1.5 }} /> Edit</MenuItem>
          <MenuItem onClick={() => { setMenuAnchor(null); onDelete(post.id); }} sx={{ fontSize: '0.9rem', color: 'error.main' }}><Delete fontSize="small" sx={{ mr: 1.5 }} /> Delete</MenuItem>
        </Menu>

        {/* Content */}
        {post.content && <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'text.primary', fontSize: '0.95rem' }}>{post.content}</Typography>}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
            {post.tags.map((tag) => (
              <Chip key={tag} label={`#${tag}`} size="small" sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.75rem', bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main', border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2), cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) } }} />
            ))}
          </Stack>
        )}

        {/* Images */}
        <PremiumImageGrid images={postImages} onImageClick={onImageClick} />

        {/* Event Date */}
        {post.eventDate && (
          <Box sx={{ mb: 2 }}>
            <Chip label={`📅 ${new Date(post.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`} size="small" sx={{ borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 600 }} />
          </Box>
        )}

        {/* Engagement Stats */}
        {(post.likes > 0 || post.comments.length > 0) && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 0.5 }}>
            {post.likes > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem', border: `2px solid ${theme.palette.background.paper}` } }}>
                  {topLikers.map((liker, i) => (
                    <Avatar key={i} sx={{ bgcolor: 'error.main' }}>{liker[0]}</Avatar>
                  ))}
                </AvatarGroup>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {post.likes} {post.likes === 1 ? 'like' : 'likes'}
                </Typography>
              </Box>
            )}
            {post.comments.length > 0 && (
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => onCommentClick(post.id)}>
                {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
              </Typography>
            )}
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Stack direction="row" spacing={1} justifyContent="space-around">
          {/* Like Button */}
          <Button
            onClick={handleLikeClick}
            startIcon={isLiked ? <Favorite /> : <FavoriteBorder />}
            sx={{
              flex: 1,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              py: 1,
              borderRadius: 2,
              color: isLiked ? 'error.main' : 'text.secondary',
              bgcolor: isLiked ? alpha(theme.palette.error.main, 0.1) : 'transparent',
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.15),
                color: 'error.main',
                transform: 'translateY(-2px)',
              }
            }}
          >
            Like
          </Button>

          {/* Comment Button */}
          <Button
            onClick={() => onCommentClick(post.id)}
            startIcon={<CommentIcon />}
            sx={{
              flex: 1,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              py: 1,
              borderRadius: 2,
              color: commentsOpen ? 'primary.main' : 'text.secondary',
              bgcolor: commentsOpen ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: 'primary.main',
                transform: 'translateY(-2px)',
              }
            }}
          >
            Comment
          </Button>

          {/* Share Button */}
          <Button
            onClick={() => onShare(post.id)}
            startIcon={<ShareIcon />}
            sx={{
              flex: 1,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              py: 1,
              borderRadius: 2,
              color: 'text.secondary',
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: alpha(theme.palette.info.main, 0.15),
                color: 'info.main',
                transform: 'translateY(-2px)',
              }
            }}
          >
            Share
          </Button>
        </Stack>
      </Box>

      {/* Comments Section */}
      {commentSection && (
        <Collapse in={commentsOpen} timeout="auto" unmountOnExit>
          <Box sx={{ bgcolor: alpha(theme.palette.background.default, 0.3), borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
            {commentSection}
          </Box>
        </Collapse>
      )}
    </Paper>
  );
}
