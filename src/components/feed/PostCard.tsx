// src/components/feed/PostCard.tsx
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
  AvatarGroup,
  Grow,
  Fade,
} from "@mui/material";
import {
  MoreVert,
  Edit,
  Delete,
  Comment as CommentIcon,
  Share as ShareIcon,
  FavoriteBorder,
  Favorite,
  Public,
  VerifiedUser,
  Lock,
  Group,
} from "@mui/icons-material";
import Image from "next/image";
import ImageCarousel from "./ImageCarousel";

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
  userId: string;
  user: string;
  username?: string;
  avatar?: string;
  content?: string;
  image?: string | null;
  images?: string[];
  tags: string[];
  date: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  eventDate?: string;
  createdAt?: string;
  visibility?: 'PUBLIC' | 'FAMILY' | 'PRIVATE';
  isOnline?: boolean;
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
  currentUserId: string;
  canEdit?: boolean;
  commentsOpen?: boolean;
  commentSection?: React.ReactNode;
};

/* -----------------------
   🎨 Premium Image Grid (Desktop)
   ----------------------- */
const DesktopImageGrid = ({
  images,
  onImageClick,
  scrollY,
}: {
  images: string[];
  onImageClick?: (index: number) => void;
  scrollY: number;
}) => {
  const theme = useTheme();
  const count = images.length;
  
  const handleImageClick = (index: number) => {
    onImageClick?.(index);
  };

  const containerStyle = {
    width: "100%",
    borderRadius: 3,
    overflow: "hidden",
    display: "grid",
    gap: 1,
    mb: 2,
    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
  };

  // ⭐ PREMIUM: Parallax effect (no transition - handled by parent)
  const getParallaxTransform = (index: number) => ({
    transform: `translateY(${scrollY * (0.02 + index * 0.01)}px)`,
  });

  const hoverEffectSx = {
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
    "&:hover img": {
      transform: "scale(1.08)",
    },
  };

  // One image
  if (count === 1) {
    return (
      <Box sx={{ ...containerStyle, aspectRatio: '16/9', position: 'relative', border: 'none' }}>
        <Box sx={{ ...hoverEffectSx, position: 'relative', width: '100%', height: '100%' }} onClick={() => handleImageClick(0)}>
          <Image
            src={images[0]}
            alt="post-img-0"
            fill
            style={{
              objectFit: "cover",
              cursor: "pointer",
              transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
              ...getParallaxTransform(0),
            }}
            sizes="(max-width: 768px) 100vw, 60vw"
          />
        </Box>
      </Box>
    );
  }

  // Two images
  if (count === 2) {
    return (
      <Box sx={{ ...containerStyle, gridTemplateColumns: "1fr 1fr", aspectRatio: '16/9' }}>
        {images.map((img, i) => (
          <Box key={i} sx={{ ...hoverEffectSx, position: 'relative' }} onClick={() => handleImageClick(i)}>
            <Image
              src={img}
              alt={`post-img-${i}`}
              fill
              style={{
                objectFit: "cover",
                cursor: "pointer",
                transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                ...getParallaxTransform(i),
              }}
              sizes="(max-width: 768px) 50vw, 30vw"
            />
          </Box>
        ))}
      </Box>
    );
  }

  // Three images
  if (count === 3) {
    return (
      <Box sx={{ ...containerStyle, gridTemplateColumns: "2fr 1fr", gridTemplateRows: "1fr 1fr" }}>
        <Box sx={{ ...hoverEffectSx, gridRow: "1 / span 2", position: 'relative' }} onClick={() => handleImageClick(0)}>
          <Image
            src={images[0]}
            alt="post-img-0"
            fill
            style={{
              objectFit: "cover",
              cursor: "pointer",
              transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
              ...getParallaxTransform(0),
            }}
            sizes="(max-width: 768px) 66vw, 40vw"
          />
        </Box>
        {images.slice(1).map((img, i) => (
          <Box key={i + 1} sx={{ ...hoverEffectSx, position: 'relative' }} onClick={() => handleImageClick(i + 1)}>
            <Image
              src={img}
              alt={`post-img-${i + 1}`}
              fill
              style={{
                objectFit: "cover",
                cursor: "pointer",
                transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                ...getParallaxTransform(i + 1),
              }}
              sizes="(max-width: 768px) 33vw, 20vw"
            />
          </Box>
        ))}
      </Box>
    );
  }

  // Four or more images
  return (
    <Box sx={{ ...containerStyle, gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }}>
      {images.slice(0, 4).map((img, i) => {
        const isLast = i === 3;
        const remaining = count - 4;
        return (
          <Box key={i} sx={{ ...hoverEffectSx, position: 'relative' }} onClick={() => handleImageClick(i)}>
            <Image
              src={img}
              alt={`post-img-${i}`}
              fill
              style={{
                objectFit: "cover",
                cursor: "pointer",
                transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                ...getParallaxTransform(i),
              }}
              sizes="(max-width: 768px) 50vw, 25vw"
            />
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
                  zIndex: 2,
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
  currentUserId,
  canEdit = true,
  commentsOpen = false,
  commentSection,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = React.useState(false);
  const [heartParticles, setHeartParticles] = React.useState<number[]>([]);
  const [scrollY, setScrollY] = React.useState(0);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = React.useState(false);
  
  // ⭐ PREMIUM: Mobile double-tap
  const [lastTap, setLastTap] = React.useState(0);

  // Refs
  const isLiked = post.likedBy.includes(currentUserId);
  const isOwnPost = post.userId === currentUserId;

  const postImages = React.useMemo(() => {
    if (post.images && post.images.length > 0) return post.images;
    if (post.image) return [post.image];
    return [];
  }, [post.images, post.image]);

  // ⭐ PREMIUM: Parallax scroll effect
  React.useEffect(() => {
    if (isMobile) return; // Only on desktop
    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // ⭐ PREMIUM: Heart burst animation on like
  const handleLikeClick = () => {
    setIsLikeAnimating(true);
    onLike(post.id);
    
    // Create heart burst effect
    if (!isLiked) {
      setHeartParticles([1, 2, 3, 4, 5, 6]);
      setTimeout(() => setHeartParticles([]), 1000);
    }
    
    setTimeout(() => setIsLikeAnimating(false), 600);
  };

  // ⭐ PREMIUM: Double-tap to like (mobile)
  const handleDoubleTap = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    // Prevent if tapping buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY && now - lastTap > 0) {
      e.preventDefault();
      
      // Show big heart animation
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 1000);
      
      // Like the post
      handleLikeClick();
      
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);
    }
    setLastTap(now);
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
    <Grow in={true} timeout={400}>
      <Paper
        elevation={0}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.6),
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          backgroundColor: theme.palette.background.paper,
          position: 'relative',
          ...(!isMobile && {
            '&:hover': {
              boxShadow: theme.palette.mode === 'dark'
                ? `0 20px 48px ${alpha(theme.palette.common.black, 0.5)}`
                : `0 20px 48px ${alpha(theme.palette.common.black, 0.12)}`,
              transform: 'translateY(-3px)',
              borderColor: alpha(theme.palette.primary.main, 0.2),
            },
          }),
        }}
      >
        {/* ⭐ PREMIUM: Top gradient bar on hover */}
        <Box 
          sx={{ 
            height: 3, 
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, 
            opacity: isHovered ? 1 : 0, 
            transition: 'opacity 0.3s' 
          }} 
        />

        {/* ⭐ PREMIUM: Double-Tap Heart Animation */}
        <Fade in={showDoubleTapHeart}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              pointerEvents: 'none',
              animation: 'doubleTapHeart 1s ease-out',
              '@keyframes doubleTapHeart': {
                '0%': {
                  opacity: 0,
                  transform: 'translate(-50%, -50%) scale(0.5)',
                },
                '15%': {
                  opacity: 1,
                  transform: 'translate(-50%, -50%) scale(1.3)',
                },
                '30%': {
                  opacity: 1,
                  transform: 'translate(-50%, -50%) scale(1.1)',
                },
                '100%': {
                  opacity: 0,
                  transform: 'translate(-50%, -50%) scale(1.5)',
                },
              },
            }}
          >
            <Favorite 
              sx={{ 
                fontSize: '5rem', 
                color: 'error.main',
                filter: 'drop-shadow(0 4px 20px rgba(239, 68, 68, 0.5))',
              }} 
            />
          </Box>
        </Fade>

        <Box sx={{ p: isMobile ? 2 : 3, pb: 1 }}>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box 
              display="flex" 
              alignItems="center" 
              gap={1.5}
            >
              {/* ⭐ PREMIUM: Avatar with online status ring */}
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <>
                    {/* Online status indicator with pulse */}
                    {post.isOnline && (
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          bgcolor: 'success.main',
                          border: `3px solid ${theme.palette.background.paper}`,
                          boxShadow: `0 0 12px ${alpha(theme.palette.success.main, 0.6)}`,
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%, 100%': {
                              boxShadow: `0 0 12px ${alpha(theme.palette.success.main, 0.6)}`,
                            },
                            '50%': {
                              boxShadow: `0 0 20px ${alpha(theme.palette.success.main, 0.9)}`,
                            },
                          },
                        }}
                      />
                    )}
                    {/* Verified badge for own posts */}
                    {isOwnPost && !post.isOnline && (
                      <VerifiedUser 
                        sx={{ 
                          width: 18, 
                          height: 18, 
                          color: 'primary.main', 
                          bgcolor: 'background.paper', 
                          borderRadius: '50%',
                          border: `2px solid ${theme.palette.background.paper}`,
                        }} 
                      />
                    )}
                  </>
                }
              >
                <Avatar 
                  src={post.avatar} 
                  sx={{ 
                    width: 46, 
                    height: 46, 
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.08) rotate(2deg)',
                      boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.15)}`,
                    },
                  }}
                >
                  {post.user.charAt(0)}
                </Avatar>
              </Badge>

              <Box>
                {/* ⭐ PREMIUM: Gradient text for username */}
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 700, 
                    lineHeight: 1.2, 
                    fontSize: '0.95rem',
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #D4C5F9 0%, #B794F6 100%)'
                      : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {post.user}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.2 }}>
                  {/* ⭐ PREMIUM: Gradient timestamp */}
                  <Typography 
                    variant="caption" 
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(90deg, rgba(180, 184, 197, 0.7) 0%, rgba(180, 184, 197, 0.4) 100%)'
                        : 'linear-gradient(90deg, rgba(83, 100, 113, 0.6) 0%, rgba(83, 100, 113, 0.3) 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {formatDate(post.date)}
                  </Typography>
                  <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                  <Tooltip title={visibilityConfig.desc} arrow>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5, 
                      color: 'text.secondary', 
                      bgcolor: alpha(theme.palette.action.hover, 0.5), 
                      px: 0.8, 
                      py: 0.3, 
                      borderRadius: 1.5,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                      },
                    }}>
                      {visibilityConfig.icon}
                      <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                        {visibilityConfig.label}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
            <Stack direction="row" spacing={0.5}>
              {canEdit && isOwnPost && (
                <IconButton 
                  onClick={(e) => setMenuAnchor(e.currentTarget)} 
                  size="small" 
                  sx={{ 
                    color: 'text.secondary',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      color: 'text.primary',
                    },
                  }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              )}
            </Stack>
          </Box>

          {/* Menu */}
          <Menu 
            anchorEl={menuAnchor} 
            open={Boolean(menuAnchor)} 
            onClose={() => setMenuAnchor(null)} 
            PaperProps={{ 
              elevation: 8, 
              sx: { 
                borderRadius: 3, 
                minWidth: 160,
                backdropFilter: 'blur(20px)',
                bgcolor: alpha(theme.palette.background.paper, 0.98),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              } 
            }}
          >
            <MenuItem 
              onClick={() => { setMenuAnchor(null); onEdit(post.id); }} 
              sx={{ 
                fontSize: '0.9rem', 
                borderRadius: 2, 
                mx: 1, 
                my: 0.5,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <Edit fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} /> 
              Edit
            </MenuItem>
            <MenuItem 
              onClick={() => { setMenuAnchor(null); onDelete(post.id); }} 
              sx={{ 
                fontSize: '0.9rem', 
                color: 'error.main',
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                },
              }}
            >
              <Delete fontSize="small" sx={{ mr: 1.5 }} /> 
              Delete
            </MenuItem>
          </Menu>

          {/* Content */}
          {post.content && (
            <Box onTouchEnd={handleDoubleTap}>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 2, 
                  lineHeight: 1.7, 
                  whiteSpace: 'pre-wrap', 
                  color: 'text.primary', 
                  fontSize: '0.95rem',
                  letterSpacing: '0.01em',
                }}
              >
                {post.content}
              </Typography>
            </Box>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
              {post.tags.map((tag) => (
                <Chip 
                  key={tag} 
                  label={`#${tag}`} 
                  size="small" 
                  sx={{ 
                    borderRadius: 2.5, 
                    fontWeight: 700, 
                    fontSize: '0.75rem', 
                    bgcolor: alpha(theme.palette.primary.main, 0.08), 
                    color: 'primary.main', 
                    border: '1.5px solid', 
                    borderColor: alpha(theme.palette.primary.main, 0.2), 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                      transform: 'translateY(-2px)',
                    },
                  }} 
                />
              ))}
            </Stack>
          )}

          {/* Images - Carousel on mobile, Grid on desktop with parallax */}
          {postImages.length > 0 && (
            <Box onTouchEnd={handleDoubleTap}>
              {isMobile ? (
                <ImageCarousel
                  images={postImages}
                  onImageClick={onImageClick}
                  aspectRatio={1}
                />
              ) : (
                <DesktopImageGrid 
                  images={postImages} 
                  onImageClick={onImageClick}
                  scrollY={scrollY}
                />
              )}
            </Box>
          )}

          {/* Event Date */}
          {post.eventDate && (
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={`📅 ${new Date(post.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`} 
                size="small" 
                sx={{ 
                  borderRadius: 2.5, 
                  bgcolor: alpha(theme.palette.info.main, 0.1), 
                  color: 'info.main', 
                  fontWeight: 600,
                  border: `1.5px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }} 
              />
            </Box>
          )}

          {/* Engagement Stats */}
          {(post.likes > 0 || post.comments.length > 0) && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 0.5 }}>
              {post.likes > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AvatarGroup 
                    max={3} 
                    sx={{ 
                      '& .MuiAvatar-root': { 
                        width: 24, 
                        height: 24, 
                        fontSize: '0.7rem', 
                        border: `2px solid ${theme.palette.background.paper}`,
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.2)',
                          zIndex: 10,
                        },
                      } 
                    }}
                  >
                    {topLikers.map((liker, i) => (
                      <Avatar key={i} sx={{ bgcolor: 'error.main' }}>{liker[0]}</Avatar>
                    ))}
                  </AvatarGroup>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                    {post.likes} {post.likes === 1 ? 'like' : 'likes'}
                  </Typography>
                </Box>
              )}
              {post.comments.length > 0 && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  fontWeight={600} 
                  sx={{ 
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      color: 'primary.main',
                      transform: 'translateX(-2px)',
                    },
                  }} 
                  onClick={() => onCommentClick(post.id)}
                >
                  {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                </Typography>
              )}
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} justifyContent="space-around">
            {/* ⭐ PREMIUM: Like Button with Heart Burst */}
            <Button
              onClick={handleLikeClick}
              startIcon={isLiked ? <Favorite /> : <FavoriteBorder />}
              sx={{
                flex: 1,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                py: 1.2,
                borderRadius: 2.5,
                color: isLiked ? 'error.main' : 'text.secondary',
                bgcolor: isLiked ? alpha(theme.palette.error.main, 0.12) : 'transparent',
                position: 'relative',
                overflow: 'visible',
                transform: isLikeAnimating ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.15),
                  color: 'error.main',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Like
              
              {/* Heart particle burst */}
              {heartParticles.map((particle, i) => (
                <Box
                  key={particle}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    fontSize: '1.2rem',
                    animation: `heartBurst${i} 1s ease-out forwards`,
                    pointerEvents: 'none',
                    zIndex: 10,
                    
                    [`@keyframes heartBurst${i}`]: {
                      '0%': {
                        opacity: 1,
                        transform: `translate(-50%, -50%) scale(0.5) rotate(0deg)`,
                      },
                      '50%': {
                        opacity: 1,
                        transform: `translate(
                          calc(-50% + ${Math.cos(i * 60 * Math.PI / 180) * 30}px),
                          calc(-50% + ${Math.sin(i * 60 * Math.PI / 180) * 30}px)
                        ) scale(1.2) rotate(${i * 60}deg)`,
                      },
                      '100%': {
                        opacity: 0,
                        transform: `translate(
                          calc(-50% + ${Math.cos(i * 60 * Math.PI / 180) * 60}px),
                          calc(-50% + ${Math.sin(i * 60 * Math.PI / 180) * 60}px)
                        ) scale(0.5) rotate(${i * 60 + 180}deg)`,
                      },
                    },
                  }}
                >
                  ❤️
                </Box>
              ))}
            </Button>

            {/* Comment Button */}
            <Button
              onClick={() => onCommentClick(post.id)}
              startIcon={<CommentIcon />}
              sx={{
                flex: 1,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                py: 1.2,
                borderRadius: 2.5,
                color: commentsOpen ? 'primary.main' : 'text.secondary',
                bgcolor: commentsOpen ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                transition: 'all 0.3s',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  color: 'primary.main',
                  transform: 'translateY(-2px)',
                  padding:'5px 32px'
                },
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
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                py: 1.2,
                borderRadius: 2.5,
                color: 'text.secondary',
                transition: 'all 0.3s',
                '&:hover': {
                  bgcolor: alpha(theme.palette.info.main, 0.15),
                  color: 'info.main',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Share
            </Button>
          </Stack>
        </Box>

        {/* Comments Section */}
        {commentSection && (
          <Collapse in={commentsOpen} timeout="auto" unmountOnExit>
            <Box sx={{ 
              bgcolor: alpha(theme.palette.background.default, 0.3), 
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}>
              {commentSection}
            </Box>
          </Collapse>
        )}
      </Paper>
    </Grow>
  );
}