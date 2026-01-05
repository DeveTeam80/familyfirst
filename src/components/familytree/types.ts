import { FamilyRole } from "@prisma/client";
import { Dayjs } from "dayjs";

export interface FamilyTreeNodeData {
  "first name": string;
  "last name"?: string;
  birthday?: string;
  deathDate?: string; 
  weddingAnniversary?: string;
  avatar?: string;
  photoUrl?: string;
  gender: "M" | "F";
  email?: string;
    label?: string; 

  [key: string]: unknown;
}

export interface FamilyTreeNode {
  id: string;
  userId?: string | null;
  data: FamilyTreeNodeData;
  rels?: {
    parents?: string[];
    spouses?: string[];
    children?: string[];
  };
}

export interface F3CardData {
  data: {
    id: string;
    _new_rel_data?: {
      rel_type: string;
      label: string;
      rel_id: string;
    };

    [key: string]: unknown;
  };
}

export interface UserAvatarDTO {
  id: string;
  avatarUrl?: string | null;
}

export interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  relativeNode: FamilyTreeNode | null;
  relationType: "children" | "spouses" | "parents" | null;
  specificRole: string | null;
  onAdd: (data: AddMemberFormData) => void;
}

export interface AddMemberFormData {
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  birthday: Dayjs | null;
  avatar: string;
}

export interface FamilyTreeChartHandle {
  resetView: () => void;
  triggerAddMode: (nodeId: string) => void;
  cancelAddMode: () => void;
}

export interface InspectorPanelProps {
  node: FamilyTreeNode | null;
  onClose: () => void;
  isAdmin: boolean;
  familyId: string;
  adminId: string;
  onEdit: () => void;
  onAddMemberClick: () => void;
}

export interface EditMemberDialogProps {
  open: boolean;
  onClose: () => void;
  node: FamilyTreeNode | null;
  onSave: (updatedNode: FamilyTreeNode) => void;
}

export type RelationType = "children" | "spouses" | "parents";
export type UserRole = FamilyRole;