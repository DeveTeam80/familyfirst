"use client";
import * as React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack
} from "@mui/material";
import { useDispatch } from "react-redux";
import { updateProfile } from "@/store/userSlice";

export default function EditProfileDialog({
  open, onClose, username, name: initialName, bio: initialBio, location: initialLocation
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  name: string;
  bio?: string;
  location?: string;
}) {
  const dispatch = useDispatch();
  const [name, setName] = React.useState(initialName);
  const [bio, setBio] = React.useState(initialBio ?? "");
  const [location, setLocation] = React.useState(initialLocation ?? "");

  React.useEffect(() => {
    if (open) {
      setName(initialName);
      setBio(initialBio ?? "");
      setLocation(initialLocation ?? "");
    }
  }, [open, initialName, initialBio, initialLocation]);

  const onSave = () => {
    dispatch(updateProfile({ username, changes: { name, bio, location } }));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} multiline minRows={3} />
          <TextField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
