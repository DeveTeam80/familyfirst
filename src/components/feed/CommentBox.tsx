"use client";
import * as React from "react";
import { 
  Box, 
  TextField, 
  Typography, 
  Stack, 
  Paper, 
  Avatar,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";

type Comment = { id: string; user: string; text: string };

export default function CommentBox({
  openForPostId,
  postId,
  comments,
  value,
  setValue,
  onSubmit,
}: {
  openForPostId: string | null;
  postId: string;
  comments: Comment[];
  value: string;
  setValue: (v: string) => void;
  onSubmit: () => void;
}) {
  const theme = useTheme();

  if (openForPostId !== postId) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.2),
        backgroundColor: alpha(theme.palette.primary.main, 0.02),
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Write a comment..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && value.trim()) {
            e.preventDefault();
            onSubmit();
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
          },
        }}
      />

      {comments.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={2}>
            {comments.map((c) => (
              <Box
                key={c.id}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: 'background.paper',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.5),
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: '0.875rem',
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                  }}
                >
                  {c.user[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0.5,
                    }}
                  >
                    {c.user}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.5,
                    }}
                  >
                    {c.text}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </>
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}
      >
        Press Enter to post • Shift + Enter for new line
      </Typography>
    </Paper>
  );
}