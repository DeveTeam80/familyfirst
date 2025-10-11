"use client";
import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";

export default function EventDialog({
  open,
  title,
  date,
  setTitle,
  setDate,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  title: string;
  date: string;
  setTitle: (v: string) => void;
  setDate: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Add Event</DialogTitle>
      <DialogContent dividers>
        <TextField label="Event Title" fullWidth margin="dense" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField
          label="Event Date"
          type="date"
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit}>
          Post Event
        </Button>
      </DialogActions>
    </Dialog>
  );
}
